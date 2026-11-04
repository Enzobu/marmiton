"""Offline tests for skill format and per-project policy generation."""
from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATOR = ROOT / "skills/project-rules-configurator/scripts/configure.py"
VALIDATOR = ROOT / "scripts/validate_skills.py"


class SkillConfiguratorTests(unittest.TestCase):
    def run_cmd(self, project: Path, *flags: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(GENERATOR), "--repo", str(project), *flags],
            capture_output=True, text=True, check=False,
        )

    def test_skills_have_valid_metadata_and_references(self) -> None:
        result = subprocess.run(
            [sys.executable, str(VALIDATOR)], capture_output=True, text=True, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_all_20_skills_are_present(self) -> None:
        skills = ROOT / "skills"
        expected = {
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
        }
        actual = {directory.name for directory in skills.iterdir() if directory.is_dir()}
        self.assertEqual(actual, expected)
        for name in expected:
            self.assertTrue((skills / name / "SKILL.md").is_file())

    def test_preview_does_not_create_anything(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            result = self.run_cmd(project, "--profile", "simple")
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("direct_main_commits: false", result.stdout)
            self.assertFalse((project / ".agent").exists())

    def test_write_requires_explicit_approval(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            denied = self.run_cmd(project, "--profile", "standard", "--write")
            self.assertNotEqual(denied.returncode, 0)
            self.assertFalse((project / ".agent").exists())
            accepted = self.run_cmd(
                project, "--profile", "standard", "--write",
                "--approval", "POLICY_APPROVED",
            )
            self.assertEqual(accepted.returncode, 0, accepted.stderr)
            policy = (project / ".agent/project-policy.yml").read_text()
            self.assertIn("profile: standard", policy)
            self.assertIn("run_existing_tests: true", policy)

    def test_direct_main_is_opt_in_simple_only(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            denied = self.run_cmd(
                project, "--profile", "simple", "--allow-direct-main",
                "--write", "--approval", "POLICY_APPROVED",
            )
            self.assertNotEqual(denied.returncode, 0)
            denied_prod = self.run_cmd(
                project, "--profile", "production", "--allow-direct-main",
                "--write", "--approval", "DIRECT_MAIN_APPROVED",
            )
            self.assertNotEqual(denied_prod.returncode, 0)
            self.assertFalse((project / ".agent").exists())
            accepted = self.run_cmd(
                project, "--profile", "simple", "--allow-direct-main",
                "--write", "--approval", "DIRECT_MAIN_APPROVED",
            )
            self.assertEqual(accepted.returncode, 0, accepted.stderr)
            self.assertIn("direct_main_commits: true", (project / ".agent/project-policy.yml").read_text())

    def test_existing_policy_is_never_overwritten_by_default(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            policy_dir = project / ".agent"
            policy_dir.mkdir()
            policy = policy_dir / "project-policy.yml"
            policy.write_text("DO NOT TOUCH", encoding="utf-8")
            result = self.run_cmd(
                project, "--profile", "standard", "--write",
                "--approval", "POLICY_APPROVED",
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(policy.read_text(), "DO NOT TOUCH")
            accepted = self.run_cmd(
                project, "--profile", "standard", "--write",
                "--approval", "POLICY_APPROVED", "--replace",
            )
            self.assertEqual(accepted.returncode, 0, accepted.stderr)

    def test_granular_workflow_requires_approval(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            flags = ("--profile", "simple", "--issues-policy", "required",
                     "--branches-policy", "required", "--pr-policy", "optional")
            preview = self.run_cmd(project, *flags)
            self.assertEqual(preview.returncode, 0, preview.stderr)
            self.assertIn("issues: required", preview.stdout)
            self.assertIn("branches: required", preview.stdout)
            self.assertIn("pull_requests: optional", preview.stdout)
            self.assertFalse((project / ".agent").exists())
            denied = self.run_cmd(project, *flags, "--write")
            self.assertNotEqual(denied.returncode, 0)
            accepted = self.run_cmd(project, *flags, "--write", "--approval", "POLICY_APPROVED")
            self.assertEqual(accepted.returncode, 0, accepted.stderr)

    def test_direct_main_conflicts_with_required_branches(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = self.run_cmd(Path(directory), "--profile", "simple",
                                  "--branches-policy", "required", "--allow-direct-main")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("conflicts", result.stderr)

    def test_protects_symlinked_policy_directory(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / "outside"
            target.mkdir()
            project = root / "project"
            project.mkdir()
            (project / ".agent").symlink_to(target, target_is_directory=True)
            result = self.run_cmd(
                project, "--profile", "simple", "--write",
                "--approval", "POLICY_APPROVED",
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(list(target.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
