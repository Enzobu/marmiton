#!/usr/bin/env bash
# Offline integration checks of the Bash project initializer.
set -euo pipefail
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
INIT="$(cd "$(dirname "$0")/../scripts" && pwd -P)/init.sh"
TMP="$(mktemp -d)"
trap 'rm -rf -- "$TMP"' EXIT
APP="$TMP/project"
mkdir -p "$APP/agent/scripts" "$APP/agent/skills"
cp "$INIT" "$APP/agent/scripts/init.sh"
printf '# Instructions\n' > "$APP/AGENTS.md"
for name in project-rules-configurator github-workflow code-review security-audit; do
 mkdir -p "$APP/agent/skills/$name/references"
 printf '%s\n' "---" "name: $name" "description: Test" "---" "# $name" > "$APP/agent/skills/$name/SKILL.md"
 printf 'Reference for %s\n' "$name" > "$APP/agent/skills/$name/references/guide.md"
done
run() { bash "$APP/agent/scripts/init.sh" "$@"; }
# Both help flags must be informative and must not write to the project.
run -h > "$TMP/help-short.log"
run --help > "$TMP/help-long.log"
cmp -s "$TMP/help-short.log" "$TMP/help-long.log" || fail 'Help flags differ'
for term in 'FONCTIONNEMENT' 'OPTIONS' 'EXEMPLES' '--profile simple' '--profile standard' '--profile production' '--agent codex' '--agent claude' '--agent both' '--all-skills' '--write' '--allow-direct-main' '--approval DIRECT_MAIN_APPROVED' '.agents/skills/' '.claude/skills/' 'ChatGPT' 'Bash'; do
 grep -Fq -- "$term" "$TMP/help-short.log" || fail "Help missing: $term"
done
[[ ! -e "$APP/.agent" && ! -e "$APP/.agents" ]] || fail 'Help modified project'
run > "$TMP/preview.log"
[[ ! -e "$APP/.agent" && ! -e "$APP/.agents" ]] || fail 'Preview modified project'
if run --write > "$TMP/error.log" 2>&1; then fail 'Write without profile accepted'; fi
if run --profile simple --allow-direct-main --write > "$TMP/error.log" 2>&1; then fail 'Direct main without approval accepted'; fi
run --profile standard --write > "$TMP/write.log"
[[ -f "$APP/.agent/project-policy.yml" ]] || fail 'Policy missing'
grep -q 'profile: standard' "$APP/.agent/project-policy.yml" || fail 'Wrong profile'
[[ -f "$APP/.agents/skills/github-workflow/SKILL.md" ]] || fail 'Codex Skill missing'
[[ -f "$APP/.claude/skills/security-audit/references/guide.md" ]] || fail 'Claude reference missing'
run --profile standard --write > "$TMP/again.log"
grep -q 'Planned new files: 0' "$TMP/again.log" || fail 'Second run not idempotent'
printf 'Local custom edits\n' > "$APP/.agents/skills/github-workflow/SKILL.md"
if run --profile standard --write > "$TMP/error.log" 2>&1; then fail 'Overwrite of local modifications accepted'; fi
grep -q 'Local custom edits' "$APP/.agents/skills/github-workflow/SKILL.md" || fail 'Modified Skill lost'
# A separate fixture confirms a symlink is rejected.
APP2="$TMP/symlink-project"
mkdir -p "$APP2/agent/scripts" "$APP2/agent/skills"
cp "$INIT" "$APP2/agent/scripts/init.sh"
printf '# Instructions\n' > "$APP2/AGENTS.md"
cp -R "$APP/agent/skills/." "$APP2/agent/skills/"
ln -s "$TMP" "$APP2/.agents"
if bash "$APP2/agent/scripts/init.sh" --profile standard --write > "$TMP/error.log" 2>&1; then fail 'Symlinked destination accepted'; fi
[[ ! -e "$TMP/skills" ]] || fail 'Symlink destination was written'
# An explicit approval is required for simple/direct-main workflow.
APP3="$TMP/simple-project"
mkdir -p "$APP3/agent/scripts" "$APP3/agent/skills"
cp "$INIT" "$APP3/agent/scripts/init.sh"
cp -R "$APP/agent/skills/." "$APP3/agent/skills/"
printf '# Instructions\n' > "$APP3/AGENTS.md"
bash "$APP3/agent/scripts/init.sh" --profile simple --allow-direct-main --approval DIRECT_MAIN_APPROVED --agent codex --write > "$TMP/simple.log"
grep -q 'direct_main_commits: true' "$APP3/.agent/project-policy.yml" || fail 'Direct main approval not written'
[[ ! -e "$APP3/.claude" ]] || fail 'Wrong agent selection'
# npm init creates package.json with no framework: it must be recognized as Node.js.
APP4="$TMP/npm-project"
mkdir -p "$APP4/agent/scripts" "$APP4/agent/skills"
cp "$INIT" "$APP4/agent/scripts/init.sh"
cp -R "$APP/agent/skills/." "$APP4/agent/skills/"
printf '# Instructions\n' > "$APP4/AGENTS.md"
for name in project-bootstrap react-ui ui-design nestjs-development api-testing database-migrations; do
  mkdir -p "$APP4/agent/skills/$name"
  printf '%s\n' "---" "name: $name" "description: Test" "---" "# $name" > "$APP4/agent/skills/$name/SKILL.md"
done
printf '{"name":"npm-init-example","version":"1.0.0","scripts":{"test":"echo ok"}}\n' > "$APP4/package.json"
printf '{"name":"npm-init-example","lockfileVersion":3}\n' > "$APP4/package-lock.json"
run_npm() { bash "$APP4/agent/scripts/init.sh" "$@"; }
run_npm --profile standard > "$TMP/npm-preview.log"
grep -q '  - .: Node.js' "$TMP/npm-preview.log" || fail 'npm init project not detected as Node.js'
grep -q 'project-bootstrap' "$TMP/npm-preview.log" || fail 'Node.js project-bootstrap Skill missing'
if grep -q 'Skills:.*nestjs-development\|Skills:.*react-ui' "$TMP/npm-preview.log"; then fail 'Invented framework for plain npm init'; fi
[[ ! -e "$APP4/.agent" && ! -e "$APP4/.agents" ]] || fail 'Node preview modified project'
run_npm --profile standard --write > "$TMP/npm-write.log"
[[ -f "$APP4/.agents/skills/project-bootstrap/SKILL.md" ]] || fail 'Node.js Skill not installed'
# Frameworks are additional specializations of a Node project.
printf '{"name":"react-example","dependencies":{"react":"^19.0.0"}}\n' > "$APP4/package.json"
run_npm --profile standard > "$TMP/react-preview.log"
grep -q '  - .: Node.js React' "$TMP/react-preview.log" || fail 'React not detected'
grep -q 'react-ui' "$TMP/react-preview.log" || fail 'React Skill not selected'
printf '{"name":"nestjs-example","dependencies":{"@nestjs/core":"^10.0.0"}}\n' > "$APP4/package.json"
run_npm --profile standard > "$TMP/nest-preview.log"
grep -q '  - .: Node.js NestJS' "$TMP/nest-preview.log" || fail 'NestJS not detected'
grep -q 'nestjs-development' "$TMP/nest-preview.log" || fail 'NestJS Skill not selected'
# A simple React front/ + Symfony api/ must be a monorepo without workspace files.
APP5="$TMP/simple-monorepo"
mkdir -p "$APP5/agent/scripts" "$APP5/agent/skills" "$APP5/front" "$APP5/api"
cp "$INIT" "$APP5/agent/scripts/init.sh"
cp -R "$APP4/agent/skills/." "$APP5/agent/skills/"
mkdir -p "$APP5/agent/skills/symfony-development" "$APP5/agent/skills/monorepo-management"
printf '%s\n' '---' 'name: symfony-development' 'description: Test' '---' '# Symfony' > "$APP5/agent/skills/symfony-development/SKILL.md"
printf '%s\n' '---' 'name: monorepo-management' 'description: Test' '---' '# Monorepo' > "$APP5/agent/skills/monorepo-management/SKILL.md"
printf '# Instructions\n' > "$APP5/AGENTS.md"
printf '{"name":"frontend","dependencies":{"react":"^19.0.0"}}\n' > "$APP5/front/package.json"
printf '{"name":"backend","require":{"symfony/framework-bundle":"^7.0"}}\n' > "$APP5/api/composer.json"
run_mono() { bash "$APP5/agent/scripts/init.sh" "$@"; }
run_mono --profile standard > "$TMP/mono-preview.log"
grep -Fq 'front: Node.js React' "$TMP/mono-preview.log" || fail 'React child not detected'
grep -Fq 'api: Symfony' "$TMP/mono-preview.log" || fail 'Symfony child not detected'
grep -Fq 'Monorepo (2 application(s))' "$TMP/mono-preview.log" || fail 'Simple monorepo not detected'
grep -q 'monorepo-management' "$TMP/mono-preview.log" || fail 'Monorepo Skill missing'
[[ ! -e "$APP5/.agents" && ! -e "$APP5/.agent" ]] || fail 'Monorepo preview wrote files'
run_mono --profile standard --write > "$TMP/mono-write.log"
for name in react-ui symfony-development monorepo-management; do
 [[ -f "$APP5/.agents/skills/$name/SKILL.md" ]] || fail "Missing installed monorepo Skill: $name"
done
[[ -f "$APP5/.agent/project-policy.yml" ]] || fail 'Monorepo policy missing'
# One nested app is not a monorepo.
rm -f "$APP5/api/composer.json"
run_mono --profile standard > "$TMP/single-child.log"
if grep -q 'Monorepo (' "$TMP/single-child.log"; then fail 'One nested app misclassified as monorepo'; fi
# Ignore dependency folders even if they include misleading manifests.
mkdir -p "$APP5/node_modules/fake" "$APP5/vendor/fake" "$APP5/agent/fake"
printf '{"name":"fake"}\n' > "$APP5/node_modules/fake/package.json"
printf '{"name":"fake"}\n' > "$APP5/vendor/fake/composer.json"
printf '{"name":"fake"}\n' > "$APP5/agent/fake/package.json"
run_mono --profile standard > "$TMP/ignore-preview.log"
if grep -Eq 'fake:|Monorepo \(' "$TMP/ignore-preview.log"; then fail 'Ignored directories affected detection'; fi
printf '%s\n' 'OK: Bash init and simple monorepo detection passed'
