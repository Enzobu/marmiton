#!/usr/bin/env python3
"""Validate the SKILL.md structure and local references without dependencies."""
from __future__ import annotations

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SKILLS = (
    "project-rules-configurator",
    "ui-design",
    "github-workflow",
    "api-testing",
    "docker-setup",
    "github-ci",
    "dokploy-cd",
    "project-bootstrap",
    "code-review",
    "release-management",
    "symfony-development",
    "nestjs-development",
    "react-ui",
    "flutter-development",
    "database-migrations",
    "docker-troubleshooting",
    "monorepo-management",
    "dependency-upgrade",
    "security-audit",
    "performance-audit",
)
REQUIRED = {
    "project-rules-configurator": ("scripts/configure.py", "references/profiles.md"),
    "ui-design": ("references/visual-analysis.md", "assets/design-brief.md"),
    "github-workflow": ("references/workflow.md",),
    "api-testing": ("references/coverage.md",),
    "docker-setup": ("references/compose-checklist.md",),
    "github-ci": ("references/pipeline.md",),
    "dokploy-cd": ("references/deployment-checklist.md",),
    "project-bootstrap": ("references/bootstrap.md",),
    "code-review": ("references/review-format.md",),
    "release-management": ("references/release-checklist.md",),
    "symfony-development": ("references/symfony-checklist.md",),
    "nestjs-development": ("references/nestjs-checklist.md",),
    "react-ui": ("references/react-ui-checklist.md",),
    "flutter-development": ("references/flutter-checklist.md",),
    "database-migrations": ("references/migration-plan.md",),
    "docker-troubleshooting": ("references/incident-triage.md",),
    "monorepo-management": ("references/workspace-checklist.md",),
    "dependency-upgrade": ("references/upgrade-checklist.md",),
    "security-audit": ("references/security-review.md",),
    "performance-audit": ("references/measurement-plan.md",),
}


def validate() -> list[str]:
    errors: list[str] = []
    root = ROOT / "skills"
    entries = sorted(item.name for item in root.iterdir() if item.is_dir()) if root.is_dir() else []
    if entries != sorted(SKILLS):
        errors.append(f"Expected exactly {SKILLS}, got {entries}")
    for name in SKILLS:
        directory = root / name
        path = directory / "SKILL.md"
        if not path.is_file():
            errors.append(f"Missing {path.relative_to(ROOT)}")
            continue
        text = path.read_text(encoding="utf-8")
        if not text.startswith("---\n"):
            errors.append(f"{name}: YAML frontmatter missing")
            continue
        sections = text.split("---\n", 2)
        if len(sections) < 3:
            errors.append(f"{name}: YAML frontmatter not terminated")
            continue
        header, content = sections[1], sections[2]
        keys = re.findall(r"^([a-z_]+):[ \t]*(.*)$", header, re.MULTILINE)
        names = [key for key, _value in keys]
        if names != ["name", "description"]:
            errors.append(f"{name}: frontmatter must contain name, description")
        if dict(keys).get("name") != name:
            errors.append(f"{name}: frontmatter name mismatch")
        if not dict(keys).get("description", "").strip():
            errors.append(f"{name}: description missing")
        if not content.strip().startswith("# "):
            errors.append(f"{name}: readable title missing")
        if len(content.strip()) < 650:
            errors.append(f"{name}: SKILL.md too short for an operational workflow")
        if "## " not in content:
            errors.append(f"{name}: operational sections missing")
        if "rules/" not in content and "règles" not in content.lower():
            errors.append(f"{name}: canonical rules reference missing")
        for cited_rule in re.findall(r"rules/[0-9]{2}-[a-z-]+\\.md", content):
            if not (ROOT / cited_rule).is_file():
                errors.append(f"{name}: missing canonical rule {cited_rule}")
        for rel in REQUIRED[name]:
            if not (directory / rel).is_file():
                errors.append(f"{name}: missing {rel}")
        for markdown_path in directory.rglob("*.md"):
            body = markdown_path.read_text(encoding="utf-8")
            for found in re.findall(r"(?<!!)\[[^\]]*\]\(([^)]+)\)", body):
                target = found.split("#", 1)[0]
                if not target or "://" in target or target.startswith("/"):
                    continue
                if not (markdown_path.parent / target).exists():
                    errors.append(f"{markdown_path.relative_to(ROOT)}: broken link {found}")
    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors), file=sys.stderr)
        return 1
    print(f"OK: validated {len(SKILLS)} Skills")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
