"""GitHub REST API client with async support, caching, and rate limit handling."""
import asyncio
import hashlib
import json
import os
import time
from pathlib import Path
from typing import Any, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

CACHE_DIR = Path("/tmp/gh_analyzer_cache")
CACHE_DIR.mkdir(exist_ok=True)
CACHE_TTL = 600  # 10 minutes


def _cache_key(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()


def _read_cache(key: str) -> Optional[Any]:
    f = CACHE_DIR / f"{key}.json"
    if not f.exists():
        return None
    try:
        data = json.loads(f.read_text())
        if time.time() - data["ts"] < CACHE_TTL:
            return data["body"]
    except Exception:
        pass
    return None


def _write_cache(key: str, body: Any) -> None:
    try:
        f = CACHE_DIR / f"{key}.json"
        f.write_text(json.dumps({"ts": time.time(), "body": body}))
    except Exception:
        pass


class GitHubClient:
    BASE = "https://api.github.com"

    def __init__(self, token: Optional[str] = None):
        self.token = token or os.getenv("GITHUB_TOKEN", "")
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    async def _get(self, path: str, params: Optional[dict] = None, raw: bool = False) -> Any:
        url = path if path.startswith("http") else f"{self.BASE}{path}"
        ck = _cache_key(url + json.dumps(params or {}, sort_keys=True))
        cached = _read_cache(ck)
        if cached is not None:
            return cached

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=self.headers, params=params)
            if resp.status_code == 404:
                raise ValueError("Repository not found (404). Check the URL and your token permissions.")
            if resp.status_code == 403:
                raise ValueError("Rate limit exceeded or access denied (403). Try again later or check your token.")
            if resp.status_code == 401:
                raise ValueError("Unauthorized (401). Invalid GitHub token.")
            resp.raise_for_status()
            if raw:
                body = resp.text
            else:
                body = resp.json()
        _write_cache(ck, body)
        return body

    async def get_repo(self, owner: str, repo: str) -> dict:
        return await self._get(f"/repos/{owner}/{repo}")

    async def get_languages(self, owner: str, repo: str) -> dict:
        return await self._get(f"/repos/{owner}/{repo}/languages")

    async def get_contributors(self, owner: str, repo: str, per_page: int = 10) -> list:
        try:
            return await self._get(f"/repos/{owner}/{repo}/contributors", {"per_page": per_page, "anon": "false"})
        except Exception:
            return []

    async def get_commit_activity(self, owner: str, repo: str) -> list:
        try:
            # Returns 52 weeks of commit counts
            return await self._get(f"/repos/{owner}/{repo}/stats/commit_activity")
        except Exception:
            return []

    async def get_code_frequency(self, owner: str, repo: str) -> list:
        try:
            return await self._get(f"/repos/{owner}/{repo}/stats/code_frequency")
        except Exception:
            return []

    async def get_issues_stats(self, owner: str, repo: str) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            open_resp = await client.get(
                f"{self.BASE}/repos/{owner}/{repo}/issues",
                headers=self.headers,
                params={"state": "open", "per_page": 1}
            )
            closed_resp = await client.get(
                f"{self.BASE}/repos/{owner}/{repo}/issues",
                headers=self.headers,
                params={"state": "closed", "per_page": 30}
            )
            prs_open = await client.get(
                f"{self.BASE}/repos/{owner}/{repo}/pulls",
                headers=self.headers,
                params={"state": "open", "per_page": 1}
            )
            labels_resp = await client.get(
                f"{self.BASE}/repos/{owner}/{repo}/labels",
                headers=self.headers,
                params={"per_page": 20}
            )

        def link_count(resp) -> int:
            link = resp.headers.get("Link", "")
            if 'rel="last"' in link:
                import re
                m = re.search(r'page=(\d+)>; rel="last"', link)
                if m:
                    return int(m.group(1))
            return len(resp.json())

        open_count = link_count(open_resp)
        closed_issues = closed_resp.json() if closed_resp.status_code == 200 else []
        closed_count = link_count(closed_resp)

        # Calculate avg close time from sample
        close_times = []
        for issue in closed_issues:
            if issue.get("pull_request"):
                continue
            if issue.get("closed_at") and issue.get("created_at"):
                from datetime import datetime
                created = datetime.fromisoformat(issue["created_at"].replace("Z", "+00:00"))
                closed = datetime.fromisoformat(issue["closed_at"].replace("Z", "+00:00"))
                close_times.append((closed - created).total_seconds() / 3600)

        avg_close_hours = sum(close_times) / len(close_times) if close_times else 0

        labels = labels_resp.json() if labels_resp.status_code == 200 else []
        label_names = [l.get("name", "") for l in labels[:10]] if isinstance(labels, list) else []

        return {
            "open_issues": open_count,
            "closed_issues": closed_count,
            "open_prs": link_count(prs_open),
            "avg_close_hours": round(avg_close_hours, 1),
            "labels": label_names,
        }

    async def get_tree(self, owner: str, repo: str, branch: str = "HEAD") -> list:
        try:
            data = await self._get(f"/repos/{owner}/{repo}/git/trees/{branch}", {"recursive": "1"})
            tree = data.get("tree", [])
            # Keep only top 2 levels
            filtered = [
                {"path": t["path"], "type": t["type"], "size": t.get("size", 0)}
                for t in tree
                if t["path"].count("/") < 2
            ]
            return filtered[:300]
        except Exception:
            return []

    async def get_readme(self, owner: str, repo: str) -> str:
        try:
            data = await self._get(f"/repos/{owner}/{repo}/readme")
            import base64
            content = data.get("content", "")
            if content:
                return base64.b64decode(content).decode("utf-8", errors="replace")
            return ""
        except Exception:
            return ""

    async def get_file_content(self, owner: str, repo: str, path: str) -> str:
        try:
            data = await self._get(f"/repos/{owner}/{repo}/contents/{path}")
            import base64
            if isinstance(data, list):
                return ""
            content = data.get("content", "")
            if content:
                return base64.b64decode(content).decode("utf-8", errors="replace")
            return ""
        except Exception:
            return ""

    async def get_releases(self, owner: str, repo: str) -> list:
        try:
            return await self._get(f"/repos/{owner}/{repo}/releases", {"per_page": 5})
        except Exception:
            return []

    async def get_branches(self, owner: str, repo: str) -> list:
        try:
            return await self._get(f"/repos/{owner}/{repo}/branches", {"per_page": 10})
        except Exception:
            return []

    async def get_topics(self, owner: str, repo: str) -> list:
        try:
            data = await self._get(f"/repos/{owner}/{repo}/topics")
            return data.get("names", [])
        except Exception:
            return []
