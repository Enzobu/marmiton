#!/usr/bin/env python3
"""Validate the documentation-only agent-rules repository using Python stdlib."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "agent"
PREFIXES = {
    "01-agent": ("A", 18),
    "02-git": ("G", 20),
    "03-github": ("H", 19),
    "04-quality": ("Q", 24),
    "05-testing": ("T", 21),
    "06-security": ("S", 24),
    "07-frontend": ("F", 30),
    "08-backend": ("B", 21),
    "09-database": ("DB", 16),
    "10-docker": ("D", 24),
    "11-observability": ("O", 10),
    "12-documentation": ("M", 12),
    "13-performance": ("P", 12),
    "14-packages": ("PK", 10),
    "15-conditional": ("X", 20),
    "17-api-testing": ("AT", 32),
    "18-ci": ("CI", 40),
    "19-cd": ("CD", 37),
    "20-environment": ("ENV", 20),
    "21-release": ("REL", 10),
    "22-ui-validation": ("UV", 10),
    "23-monorepo": ("MR", 10),
    "24-operations": ("OPS", 10),
    "25-governance": ("RG", 10),
}
REQUIRED = [
    "AGENTS.md", "CLAUDE.md", "README.md", "docs/INSTALLATION.md",
    "docs/VALIDATION.md", "docs/CI.md", "chatgpt/PROJECT_INSTRUCTIONS.md",
    "rules/16-stacks.md", "rules/17-api-testing.md", "rules/18-ci.md",
    "docs/API_AUTH.md", "examples/api-auth/postman-login.js",
    "examples/api-auth/bruno-login.js", "tests/test_api_auth.js",
    ".claude/rules/00-core.md", ".claude/rules/21-api-testing.md",
    ".claude/rules/22-ci.md", ".claude/rules/23-cd.md",
    "rules/19-cd.md", "docs/CD.md", "docs/DEPLOYMENT_CHECKLIST.md",
    "rules/20-environment.md", "docs/ENVIRONMENT.md",
    "rules/21-release.md", "rules/22-ui-validation.md",
    "rules/23-monorepo.md", "rules/24-operations.md",
    "rules/25-governance.md", "docs/RULES_LOADING.md",
    "scripts/dokploy_deploy.sh", "templates/dokploy/deploy-jobs.yml",
    "docs/SKILLS.md", "docs/SKILL_ORCHESTRATION.md", "scripts/validate_skills.py", "scripts/sync_skills.py", "tests/test_skill_sync.py",
    "skills/project-rules-configurator/SKILL.md",
    "skills/project-rules-configurator/scripts/configure.py",
    "skills/ui-design/SKILL.md", "tests/test_skill_configurator.py",
    "scripts/init.sh", "tests/test_init.sh",
]
ERRORS: list[str] = []


def fail(message: str) -> None:
    ERRORS.append(message)


def check_links(path: Path, body: str) -> None:
    # Ignore absolute URLs and fragments. Check only relative Markdown paths.
    for match in re.finditer(r"(?<!!)\[[^\]]*\]\(([^)]+)\)", body):
        target = match.group(1).split("#", 1)[0]
        if not target or "://" in target or target.startswith(("mailto:", "/")):
            continue
        if not (path.parent / target).exists():
            fail(f"{path.relative_to(ROOT)}: missing link target {target}")


def main() -> int:
    for name in REQUIRED:
        base = ROOT if name in {"AGENTS.md", "CLAUDE.md", "README.md"} or name.startswith(".claude/") else CATALOG
        if not (base / name).is_file():
            fail(f"Missing required file: {name}")

    seen: set[str] = set()
    count = 0
    for filename, (prefix, expected) in PREFIXES.items():
        path = CATALOG / "rules" / f"{filename}.md"
        if not path.is_file():
            fail(f"Missing rules file: {path.relative_to(ROOT)}")
            continue
        content = path.read_text(encoding="utf-8")
        found = re.findall(r"^## (?:# )?(" + re.escape(prefix) + r"\d{2})\b", content, re.MULTILINE)
        # Legacy sections use '## T01', while CI/API follow the same pattern.
        values = [f"{prefix}{i:02d}" for i in range(1, expected + 1)]
        if found != values:
            fail(f"{path.relative_to(ROOT)}: IDs expected {values}, got {found}")
        for value in found:
            if value in seen:
                fail(f"Duplicate rule ID {value}")
            seen.add(value)
        count += len(found)

    for path in ROOT.rglob("*.md"):
        if ".git" in path.parts:
            continue
        check_links(path, path.read_text(encoding="utf-8"))

    expected = sum(count for _prefix, count in PREFIXES.values())
    if count != expected:
        fail(f"Rule count mismatch: actual {count}, expected {expected}")

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    if str(expected) not in readme:
        fail(f"README must announce {expected} numbered rules")

    allowed_workflows = {"ci.yml"}
    for workflow in (ROOT / ".github/workflows").glob("*"):
        if workflow.is_file() and workflow.name not in allowed_workflows:
            fail(f"Unexpected active workflow: {workflow.name}")

    for file in (ROOT / "AGENTS.md", ROOT / "CLAUDE.md", CATALOG / "chatgpt/PROJECT_INSTRUCTIONS.md"):
        content = file.read_text(encoding="utf-8")
        for needle in ("agent/rules/18-ci.md", "agent/rules/17-api-testing.md", "agent/rules/19-cd.md", "agent/rules/20-environment.md"):
            if needle not in content:
                fail(f"{file.relative_to(ROOT)} must mention {needle}")

    if ERRORS:
        print("\n".join(f"ERROR: {issue}" for issue in ERRORS), file=sys.stderr)
        return 1
    print(f"OK: {count} unique numbered rules; required files and Markdown links valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
