#!/usr/bin/env python3
"""Install/update agent-rules Skills without overwriting unmanaged or modified files.

Dry run by default; no network, Git operations, deletion or deployment.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile

AGENTS = {'codex': Path('.agents/skills'), 'claude': Path('.claude/skills')}
MANIFEST = Path('.agent/skills-lock.json')
SKIP = {'__pycache__', '.DS_Store'}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def regular_file(path: Path) -> bool:
    return path.is_file() and not path.is_symlink()


def assert_safe_path(root: Path, path: Path) -> None:
    if not path.is_relative_to(root):
        raise ValueError('Path escapes target project')
    cursor = root
    for piece in path.relative_to(root).parts:
        cursor = cursor / piece
        if cursor.is_symlink():
            raise ValueError(f'Symlink forbidden: {cursor}')


def source_skill_files(source: Path, names: list[str]) -> dict[str, bytes]:
    skills = source / 'skills'
    if not skills.is_dir() or skills.is_symlink():
        raise ValueError('Missing or symlinked skills source directory')
    out: dict[str, bytes] = {}
    for name in names:
        if not name or name in ('.', '..') or '/' in name or '\\' in name:
            raise ValueError(f'Invalid Skill name: {name!r}')
        skill = skills / name
        if not skill.is_dir() or skill.is_symlink() or not regular_file(skill / 'SKILL.md'):
            raise ValueError(f'Missing or unsafe Skill: {name}')
        for path in sorted(skill.rglob('*')):
            if any(part in SKIP for part in path.relative_to(skill).parts) or path.suffix == '.pyc':
                continue
            if path.is_symlink():
                raise ValueError(f'Symlink forbidden in Skill: {path}')
            if not path.is_file():
                continue
            out[str(path.relative_to(skills))] = path.read_bytes()
    return out


def load_manifest(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    if not regular_file(path):
        raise ValueError('Unsafe manifest file')
    raw = json.loads(path.read_text(encoding='utf-8'))
    if raw.get('schema_version') != 1 or not isinstance(raw.get('files'), dict):
        raise ValueError('Invalid manifest schema')
    result = raw['files']
    if any(not isinstance(k, str) or not isinstance(v, str) or len(v) != 64 for k, v in result.items()):
        raise ValueError('Invalid manifest entry')
    return result


def plan(source: Path, target: Path, agents: list[str], names: list[str]) -> tuple[dict[Path, bytes], dict[str, str], list[str]]:
    payload = source_skill_files(source, names)
    manifest_path = target / MANIFEST
    assert_safe_path(target, manifest_path)
    previous = load_manifest(manifest_path)
    result = dict(previous)
    writes: dict[Path, bytes] = {}
    actions: list[str] = []
    conflicts: list[str] = []
    for agent in agents:
        for relative, data in payload.items():
            path = target / AGENTS[agent] / relative
            assert_safe_path(target, path)
            key = str(path.relative_to(target))
            digest = sha(data)
            if path.exists():
                if not regular_file(path):
                    conflicts.append(f'Unsafe file: {key}')
                    continue
                actual = sha(path.read_bytes())
                if actual == digest:
                    result[key] = digest
                    actions.append(f'unchanged {key}')
                    continue
                if key not in previous:
                    conflicts.append(f'Unmanaged file differs: {key}')
                    continue
                if actual != previous[key]:
                    conflicts.append(f'Locally modified file: {key}')
                    continue
                actions.append(f'update {key}')
            else:
                if key in previous:
                    conflicts.append(f'Managed file removed locally: {key}')
                    continue
                actions.append(f'install {key}')
            writes[path] = data
            result[key] = digest
    if conflicts:
        raise ValueError('Conflicts detected; no changes made:\n' + '\n'.join(conflicts))
    return writes, result, actions


def write_atomic(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix='.skill-sync-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--target', type=Path, required=True)
    parser.add_argument('--agent', choices=['codex', 'claude', 'both'], default='both')
    parser.add_argument('--skills', nargs='*', default=None, help='Skill names; default all')
    parser.add_argument('--write', action='store_true', help='Apply verified changes')
    args = parser.parse_args(argv)
    source = args.source.resolve()
    target = args.target.resolve()
    if not target.is_dir():
        parser.error('Project directory does not exist')
    agents = list(AGENTS) if args.agent == 'both' else [args.agent]
    if args.skills is None:
        names = sorted(p.name for p in (source / 'skills').iterdir() if p.is_dir())
    else:
        names = sorted(set(args.skills))
        if not names:
            parser.error('At least one Skill required')
    try:
        writes, manifest, actions = plan(source, target, agents, names)
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        parser.error(str(exc))
    print(f"{'APPLY' if args.write else 'PREVIEW'}: {len(names)} Skills, {len(agents)} agent(s), {len(writes)} new/updated files")
    for action in actions:
        print(action)
    if not args.write:
        return 0
    # Preflight all paths before the first write. No pruning of obsolete files.
    for path in writes:
        assert_safe_path(target, path)
    for path, data in writes.items():
        write_atomic(path, data)
    lock = target / MANIFEST
    assert_safe_path(target, lock)
    write_atomic(lock, (json.dumps({'schema_version': 1, 'files': dict(sorted(manifest.items()))}, indent=2) + '\n').encode())
    print(f'Updated {lock}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
