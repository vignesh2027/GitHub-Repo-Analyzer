"""FastAPI route definitions for GitHub Repo Analyzer."""
import asyncio
import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from analyzer import (
    DEPENDENCY_FILES,
    CI_FILES,
    TEST_PATTERNS,
    build_file_tree,
    compute_health_score,
    detect_dependencies,
)
from github_client import GitHubClient

router = APIRouter()


def parse_repo_url(url: str) -> tuple[str, str]:
    url = url.strip().rstrip("/")
    # Support https://github.com/owner/repo or owner/repo
    m = re.match(r"(?:https?://github\.com/)?([^/]+)/([^/]+?)(?:\.git)?$", url)
    if not m:
        raise ValueError(f"Invalid GitHub URL: {url}")
    return m.group(1), m.group(2)


class AnalyzeRequest(BaseModel):
    url: str
    token: Optional[str] = None


@router.post("/analyze")
async def analyze_repo(req: AnalyzeRequest):
    try:
        owner, repo = parse_repo_url(req.url)
    except ValueError as e:
        raise HTTPException(400, str(e))

    client = GitHubClient(token=req.token)

    # Parallel fetch of everything
    try:
        (
            repo_data,
            languages,
            contributors,
            commit_activity,
            topics,
            branches,
            releases,
        ) = await asyncio.gather(
            client.get_repo(owner, repo),
            client.get_languages(owner, repo),
            client.get_contributors(owner, repo, per_page=10),
            client.get_commit_activity(owner, repo),
            client.get_topics(owner, repo),
            client.get_branches(owner, repo),
            client.get_releases(owner, repo),
        )
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Tree + README + issues (slightly slower, do after main data)
    tree_data, readme_raw, issues_stats = await asyncio.gather(
        client.get_tree(owner, repo, repo_data.get("default_branch", "HEAD")),
        client.get_readme(owner, repo),
        client.get_issues_stats(owner, repo),
    )

    file_tree = build_file_tree(tree_data)

    # Detect dependency files from tree
    dep_files_in_repo = {}
    paths_set = {item["path"] for item in tree_data}
    for dep_file, lang in DEPENDENCY_FILES.items():
        if dep_file in paths_set:
            dep_files_in_repo[dep_file] = lang

    # Fetch dependency file contents
    dep_tasks = {
        fname: client.get_file_content(owner, repo, fname)
        for fname in dep_files_in_repo
        if "*" not in fname
    }
    if dep_tasks:
        contents = await asyncio.gather(*dep_tasks.values())
        dep_contents = dict(zip(dep_tasks.keys(), contents))
    else:
        dep_contents = {}

    all_deps = []
    for fname, content in dep_contents.items():
        lang = dep_files_in_repo[fname]
        parsed = detect_dependencies(content, lang)
        all_deps.append({"file": fname, "language": lang, "packages": parsed})

    # Health score inputs
    flat_paths = [item["path"] for item in tree_data]
    has_ci = any(
        any(ci in p for ci in CI_FILES)
        for p in flat_paths
    )
    has_tests = any(
        any(tp in p.lower() for tp in TEST_PATTERNS)
        for p in flat_paths
    )
    has_license = bool(repo_data.get("license"))
    has_readme = bool(readme_raw)

    health = compute_health_score(
        repo_data=repo_data,
        has_readme=has_readme,
        readme_length=len(readme_raw),
        has_license=has_license,
        has_ci=has_ci,
        has_tests=has_tests,
        commit_activity=commit_activity or [],
        contributors_count=len(contributors),
        open_issues=issues_stats.get("open_issues", 0),
        closed_issues=issues_stats.get("closed_issues", 0),
    )

    # Normalize contributors
    contributors_clean = [
        {
            "login": c.get("login", ""),
            "avatar_url": c.get("avatar_url", ""),
            "html_url": c.get("html_url", ""),
            "contributions": c.get("contributions", 0),
        }
        for c in (contributors or [])
        if isinstance(c, dict)
    ]

    # Language totals for pie chart
    lang_total = sum(languages.values()) if languages else 1
    languages_pct = {
        lang: round(count / lang_total * 100, 2)
        for lang, count in sorted(languages.items(), key=lambda x: -x[1])
    } if languages else {}

    return {
        "owner": owner,
        "repo": repo,
        "repo_data": {
            "name": repo_data.get("name"),
            "full_name": repo_data.get("full_name"),
            "description": repo_data.get("description"),
            "html_url": repo_data.get("html_url"),
            "homepage": repo_data.get("homepage"),
            "stars": repo_data.get("stargazers_count", 0),
            "forks": repo_data.get("forks_count", 0),
            "watchers": repo_data.get("watchers_count", 0),
            "open_issues": repo_data.get("open_issues_count", 0),
            "default_branch": repo_data.get("default_branch", "main"),
            "created_at": repo_data.get("created_at"),
            "updated_at": repo_data.get("updated_at"),
            "pushed_at": repo_data.get("pushed_at"),
            "size_kb": repo_data.get("size", 0),
            "license": repo_data.get("license", {}).get("spdx_id") if repo_data.get("license") else None,
            "language": repo_data.get("language"),
            "visibility": repo_data.get("visibility", "public"),
            "archived": repo_data.get("archived", False),
            "fork": repo_data.get("fork", False),
            "has_issues": repo_data.get("has_issues", True),
            "has_wiki": repo_data.get("has_wiki", False),
            "has_pages": repo_data.get("has_pages", False),
            "topics": topics,
            "owner_avatar": repo_data.get("owner", {}).get("avatar_url", ""),
        },
        "languages": languages_pct,
        "raw_languages": languages,
        "contributors": contributors_clean,
        "commit_activity": commit_activity or [],
        "issues": issues_stats,
        "file_tree": file_tree,
        "dependencies": all_deps,
        "readme": readme_raw,
        "health": health,
        "branches": [b.get("name") for b in (branches or []) if isinstance(b, dict)],
        "releases": [
            {
                "name": r.get("name") or r.get("tag_name"),
                "tag": r.get("tag_name"),
                "published_at": r.get("published_at"),
                "prerelease": r.get("prerelease", False),
            }
            for r in (releases or [])
            if isinstance(r, dict)
        ],
    }


@router.get("/health")
async def api_health():
    return {"status": "ok"}
