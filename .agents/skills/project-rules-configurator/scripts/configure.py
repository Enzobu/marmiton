#!/usr/bin/env python3
"""Generate a minimal, auditable per-project workflow policy.

Stdlib only. Dry-run by default; never performs a git or GitHub write.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import sys

PROFILES = {
    "simple": ("optional", "optional", "optional"),
    "standard": ("required", "required", "required"),
    "production": ("required", "required", "required"),
}


def render(profile: str, direct_main: bool, issues_policy: str | None = None,
           branches_policy: str | None = None, pr_policy: str | None = None) -> str:
    issues, branches, prs = PROFILES[profile]
    issues = issues_policy or issues
    branches = branches_policy or branches
    prs = pr_policy or prs
    if direct_main and branches == "required":
        raise ValueError("Direct main conflicts with required feature branches")
    if direct_main and profile != "simple":
        raise ValueError("Direct main commits are available only in the simple profile")
    return (
        "schema_version: 1\n"
        f"profile: {profile}\n"
        "git:\n"
        f"  issues: {issues}\n"
        f"  branches: {branches}\n"
        f"  pull_requests: {prs}\n"
        f"  direct_main_commits: {str(direct_main).lower()}\n"
        "  base_branch: auto\n"
        "testing:\n"
        "  run_existing_tests: true\n"
        "deployment:\n"
        "  mode: none\n"
        "metadata:\n"
        "  source: agent-rules\n"
        "  configured_with_explicit_approval: true\n"
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--profile", choices=tuple(PROFILES), required=True)
    parser.add_argument("--allow-direct-main", action="store_true")
    parser.add_argument("--issues-policy", choices=("required", "optional"))
    parser.add_argument("--branches-policy", choices=("required", "optional"))
    parser.add_argument("--pr-policy", choices=("required", "optional"))
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--replace", action="store_true")
    parser.add_argument(
        "--approval", choices=["POLICY_APPROVED", "DIRECT_MAIN_APPROVED"],
        help="Affirm explicit user approval for a write",
    )
    args = parser.parse_args(argv)
    try:
        content = render(args.profile, args.allow_direct_main,
                         args.issues_policy, args.branches_policy, args.pr_policy)
    except ValueError as exc:
        parser.error(str(exc))

    if not args.repo.is_dir():
        parser.error("Project directory does not exist")
    target_dir = args.repo / ".agent"
    target = target_dir / "project-policy.yml"

    if not args.write:
        if args.replace:
            parser.error("--replace requires --write")
        print("# PREVIEW ONLY: no project files modified")
        print(content, end="")
        return 0

    if args.allow_direct_main:
        if args.approval != "DIRECT_MAIN_APPROVED":
            parser.error("Direct main requires explicit DIRECT_MAIN_APPROVED")
    elif args.approval != "POLICY_APPROVED":
        parser.error("Writing requires explicit POLICY_APPROVED")

    if target_dir.is_symlink() or target.is_symlink():
        parser.error("Refusing to follow a symbolic link")
    if target.exists() and not args.replace:
        parser.error("Policy already exists: use --replace after reviewing the diff")
    # Avoid altering unrelated files, credentials, branches or repository configuration.
    target_dir.mkdir(exist_ok=True)
    if target_dir.is_symlink():
        parser.error("Refusing to follow a symbolic link")
    if args.replace:
        if target.exists() and not target.is_file():
            parser.error("Refusing to replace a non-file target")
        target.write_text(content, encoding="utf-8")
    else:
        with target.open("x", encoding="utf-8") as output:
            output.write(content)
    print(f"Wrote {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
