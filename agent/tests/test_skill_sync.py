"""Offline integration tests for the safe Skill synchronizer."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'sync_skills.py'


class SkillSyncTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.source = root / 'source'
        self.target = root / 'app'
        self.source.mkdir()
        self.target.mkdir()
        skill = self.source / 'skills' / 'example'
        (skill / 'references').mkdir(parents=True)
        (skill / 'SKILL.md').write_text('---\nname: example\ndescription: Example skill\n---\n# Example\n')
        (skill / 'references' / 'guide.md').write_text('# Guide\n')

    def run_cli(self, *flags):
        return subprocess.run([sys.executable, str(SCRIPT), '--source', str(self.source), '--target', str(self.target), *flags], capture_output=True, text=True)

    def test_preview_makes_no_changes(self):
        result = self.run_cli()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse((self.target / '.agent').exists())
        self.assertFalse((self.target / '.agents').exists())

    def test_install_and_idempotent_sync_for_both(self):
        result = self.run_cli('--write')
        self.assertEqual(result.returncode, 0, result.stderr)
        for folder in ('.agents/skills', '.claude/skills'):
            self.assertTrue((self.target / folder / 'example' / 'SKILL.md').exists())
            self.assertTrue((self.target / folder / 'example' / 'references/guide.md').exists())
        data = json.loads((self.target / '.agent/skills-lock.json').read_text())
        self.assertEqual(len(data['files']), 4)
        again = self.run_cli('--write')
        self.assertEqual(again.returncode, 0, again.stderr)
        self.assertIn('0 new/updated', again.stdout)

    def test_safe_upgrade_if_unmodified(self):
        self.assertEqual(self.run_cli('--write').returncode, 0)
        (self.source / 'skills/example/SKILL.md').write_text('Updated version\n')
        result = self.run_cli('--write')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.target / '.agents/skills/example/SKILL.md').read_text(), 'Updated version\n')

    def test_modified_file_blocks_all_writes(self):
        self.assertEqual(self.run_cli('--write').returncode, 0)
        modified = self.target / '.agents/skills/example/SKILL.md'
        modified.write_text('Local custom changes\n')
        old = self.target / '.claude/skills/example/SKILL.md'
        previous = old.read_bytes()
        (self.source / 'skills/example/SKILL.md').write_text('New upstream\n')
        bad = self.run_cli('--write')
        self.assertNotEqual(bad.returncode, 0)
        self.assertIn('Locally modified file', bad.stderr)
        self.assertEqual(modified.read_text(), 'Local custom changes\n')
        self.assertEqual(old.read_bytes(), previous)

    def test_unmanaged_collision_is_not_overwritten(self):
        target = self.target / '.agents/skills/example/SKILL.md'
        target.parent.mkdir(parents=True)
        target.write_text('Existing independent Skill')
        run = self.run_cli('--agent', 'codex', '--write')
        self.assertNotEqual(run.returncode, 0)
        self.assertEqual(target.read_text(), 'Existing independent Skill')
        self.assertFalse((self.target / '.agent').exists())

    def test_symlink_in_target_is_refused(self):
        other = self.target.parent / 'other'
        other.mkdir()
        (self.target / '.agents').symlink_to(other, target_is_directory=True)
        result = self.run_cli('--agent', 'codex', '--write')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((other / 'skills').exists())

    def test_source_symlink_is_refused(self):
        guide = self.source / 'skills/example/references/guide.md'
        guide.unlink()
        guide.symlink_to(self.source / 'skills/example/SKILL.md')
        result = self.run_cli('--write')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.target / '.agent').exists())

    def test_single_agent_and_selected_skill(self):
        result = self.run_cli('--agent', 'claude', '--skills', 'example', '--write')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.target / '.claude/skills/example/SKILL.md').is_file())
        self.assertFalse((self.target / '.agents').exists())

    def test_unmanaged_files_are_not_removed(self):
        extra = self.target / '.claude/skills/unrelated/SKILL.md'
        extra.parent.mkdir(parents=True)
        extra.write_text('Local only')
        self.assertEqual(self.run_cli('--write').returncode, 0)
        self.assertEqual(extra.read_text(), 'Local only')

    def test_deleted_managed_file_requires_manual_resolution(self):
        self.assertEqual(self.run_cli('--write').returncode, 0)
        missing = self.target / '.agents/skills/example/SKILL.md'
        missing.unlink()
        result = self.run_cli('--write')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Managed file removed locally', result.stderr)


if __name__ == '__main__':
    unittest.main()
