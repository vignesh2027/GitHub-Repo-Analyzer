"""Health score computation and dependency file detection."""
import re
from datetime import datetime, timezone
from typing import Any, Optional


DEPENDENCY_FILES = {
    "package.json": "nodejs",
    "requirements.txt": "python",
    "Pipfile": "python",
    "pyproject.toml": "python",
    "Cargo.toml": "rust",
    "go.mod": "go",
    "pom.xml": "java",
    "build.gradle": "java",
    "composer.json": "php",
    "Gemfile": "ruby",
    "Package.swift": "swift",
    "pubspec.yaml": "dart",
    "mix.exs": "elixir",
    "*.csproj": "dotnet",
}

CI_FILES = {
    ".github/workflows",
    ".travis.yml",
    "circle.yml",
    ".circleci",
    "Jenkinsfile",
    ".gitlab-ci.yml",
    "azure-pipelines.yml",
    ".buildkite",
}

TEST_PATTERNS = {
    "test", "tests", "spec", "specs", "__tests__",
    "_test.go", "_test.py", ".test.js", ".spec.js",
    ".test.ts", ".spec.ts",
}


def detect_dependencies(file_content: str, file_type: str) -> list[dict]:
    """Parse dependency file and return list of {name, version} dicts."""
    deps = []

    if file_type == "nodejs":
        try:
            import json
            data = json.loads(file_content)
            for section in ("dependencies", "devDependencies", "peerDependencies"):
                for name, version in (data.get(section) or {}).items():
                    deps.append({"name": name, "version": version, "type": section})
        except Exception:
            pass

    elif file_type == "python":
        if "requirements" in file_type or True:
            for line in file_content.splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                # Handle -r, -c etc
                if line.startswith("-"):
                    continue
                m = re.match(r"^([A-Za-z0-9_\-\.]+)\s*([><=!~^].+)?$", line)
                if m:
                    deps.append({"name": m.group(1), "version": (m.group(2) or "").strip(), "type": "dependency"})

    elif file_type == "rust":
        in_deps = False
        for line in file_content.splitlines():
            if re.match(r"^\[.*dependencies.*\]", line):
                in_deps = True
                continue
            if line.startswith("[") and "dependencies" not in line:
                in_deps = False
            if in_deps:
                m = re.match(r'^([a-z_\-]+)\s*=\s*"([^"]+)"', line)
                if m:
                    deps.append({"name": m.group(1), "version": m.group(2), "type": "dependency"})
                m2 = re.match(r'^([a-z_\-]+)\s*=\s*\{.*version\s*=\s*"([^"]+)"', line)
                if m2:
                    deps.append({"name": m2.group(1), "version": m2.group(2), "type": "dependency"})

    elif file_type == "go":
        for line in file_content.splitlines():
            m = re.match(r"^\s+([a-zA-Z0-9_/\.\-]+)\s+(v[0-9][^\s]+)", line)
            if m:
                deps.append({"name": m.group(1), "version": m.group(2), "type": "dependency"})

    return deps[:100]  # cap


def compute_health_score(
    repo_data: dict,
    has_readme: bool,
    readme_length: int,
    has_license: bool,
    has_ci: bool,
    has_tests: bool,
    commit_activity: list,
    contributors_count: int,
    open_issues: int,
    closed_issues: int,
) -> dict:
    """Compute a 0-100 health score with sub-scores."""
    scores = {}
    details = {}

    # 1. README quality (0-20)
    if has_readme and readme_length > 2000:
        scores["readme"] = 20
        details["readme"] = "Excellent README"
    elif has_readme and readme_length > 500:
        scores["readme"] = 14
        details["readme"] = "Good README"
    elif has_readme:
        scores["readme"] = 7
        details["readme"] = "Short README"
    else:
        scores["readme"] = 0
        details["readme"] = "No README"

    # 2. License (0-10)
    if has_license:
        scores["license"] = 10
        details["license"] = "Has license"
    else:
        scores["license"] = 0
        details["license"] = "No license"

    # 3. CI/CD (0-15)
    if has_ci:
        scores["ci"] = 15
        details["ci"] = "CI/CD configured"
    else:
        scores["ci"] = 0
        details["ci"] = "No CI/CD"

    # 4. Tests (0-15)
    if has_tests:
        scores["tests"] = 15
        details["tests"] = "Tests present"
    else:
        scores["tests"] = 0
        details["tests"] = "No tests detected"

    # 5. Recent activity (0-20) — based on last 12 weeks
    recent_weeks = commit_activity[-12:] if commit_activity else []
    active_weeks = sum(1 for w in recent_weeks if (w.get("total", 0) if isinstance(w, dict) else 0) > 0)
    if active_weeks >= 10:
        scores["activity"] = 20
        details["activity"] = "Very active"
    elif active_weeks >= 6:
        scores["activity"] = 14
        details["activity"] = "Moderately active"
    elif active_weeks >= 2:
        scores["activity"] = 8
        details["activity"] = "Low activity"
    else:
        scores["activity"] = 2
        details["activity"] = "Inactive"

    # 6. Community (0-10)
    stars = repo_data.get("stargazers_count", 0)
    if stars >= 1000:
        scores["community"] = 10
        details["community"] = "Popular project"
    elif stars >= 100:
        scores["community"] = 7
        details["community"] = "Growing community"
    elif stars >= 10:
        scores["community"] = 4
        details["community"] = "Small community"
    else:
        scores["community"] = 1
        details["community"] = "Just starting"

    # 7. Issue resolution (0-10)
    total_issues = open_issues + closed_issues
    if total_issues > 0:
        resolution_rate = closed_issues / total_issues
        if resolution_rate >= 0.8:
            scores["issues"] = 10
            details["issues"] = "Excellent issue resolution"
        elif resolution_rate >= 0.5:
            scores["issues"] = 6
            details["issues"] = "Good issue resolution"
        else:
            scores["issues"] = 3
            details["issues"] = "Many open issues"
    else:
        scores["issues"] = 5
        details["issues"] = "No issues tracked"

    total = sum(scores.values())

    return {
        "total": min(100, total),
        "breakdown": scores,
        "details": details,
        "grade": "A" if total >= 80 else "B" if total >= 60 else "C" if total >= 40 else "D",
    }


def build_file_tree(flat_paths: list[dict]) -> list[dict]:
    """Convert flat path list into nested tree structure."""
    root: list[dict] = []

    def get_or_create(node_list: list, name: str, is_dir: bool) -> dict:
        for n in node_list:
            if n["name"] == name:
                return n
        new_node = {"name": name, "type": "tree" if is_dir else "blob", "children": [] if is_dir else None}
        node_list.append(new_node)
        return new_node

    for item in flat_paths:
        parts = item["path"].split("/")
        current = root
        for i, part in enumerate(parts):
            is_last = i == len(parts) - 1
            is_dir = not is_last or item["type"] == "tree"
            node = get_or_create(current, part, is_dir)
            if not is_last and node["children"] is not None:
                current = node["children"]

    def sort_tree(nodes: list) -> list:
        dirs = sorted([n for n in nodes if n["type"] == "tree"], key=lambda x: x["name"])
        files = sorted([n for n in nodes if n["type"] != "tree"], key=lambda x: x["name"])
        for d in dirs:
            if d["children"]:
                d["children"] = sort_tree(d["children"])
        return dirs + files

    return sort_tree(root)
