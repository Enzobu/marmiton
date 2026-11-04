#!/usr/bin/env bash
set -euo pipefail
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
ROOT="$(cd "$(dirname "$0")/../.." && pwd -P)"
SOURCE="$ROOT/agent/skills"
PROFILE='' AGENT='both' WRITE=false ALL=false DIRECT=false APPROVAL=''
show_help() {
  cat <<'HELP'
Initialisation d'un projet créé depuis le template GitHub agent-rules.

UTILISATION
  bash agent/scripts/init.sh [OPTIONS]
  bash agent/scripts/init.sh -h
  bash agent/scripts/init.sh --help

FONCTIONNEMENT
  1. Détecte la stack à partir des fichiers déjà présents dans le projet :
     composer.json / symfony.lock (Symfony), package.json (Node.js ;\n     React / NestJS seulement si leurs dépendances sont présentes),
     pubspec.yaml (Flutter), pnpm-workspace.yaml (monorepo),
     compose.yaml / docker-compose.yml / Dockerfile (Docker).
     Analyse la racine, les sous-dossiers directs (front/, api/, etc.) et
     apps/*, packages/*, services/*. Ignore node_modules/, vendor/,
     dist/, build/, agent/ et les liens symboliques.
     Détecte un monorepo à partir de plusieurs applications, même sans
     déclaration de workspace ; affiche le détail par dossier.
  2. Sélectionne quatre Skills de base : project-rules-configurator,
     github-workflow, code-review et security-audit ; ajoute les Skills
     spécifiques aux stacks détectées sans les dupliquer. Dès qu'au moins
     deux applications sont reconnues, ajoute monorepo-management.
  3. Prépare .agent/project-policy.yml selon le profil Git choisi.
  4. Copie les Skills et leurs ressources aux emplacements natifs :
     .agents/skills/ (Codex) et .claude/skills/ (Claude Code).

OPTIONS
  --profile simple       Issues, branches et PR facultatives.
  --profile standard     Issues, branches et PR obligatoires.
  --profile production   Issues, branches et PR obligatoires, comme standard.
                         Aucun déploiement automatique n'est configuré.
  --agent codex          Installe les Skills uniquement pour Codex.
  --agent claude         Installe les Skills uniquement pour Claude Code.
  --agent both           Installe pour Codex et Claude Code (par défaut).
  --all-skills           Installe les 20 Skills au lieu de la sélection
                         basée sur la stack.
  --write                Applique la configuration ; nécessite --profile.
                         Sans --write, simple prévisualisation sans écriture.
  --allow-direct-main    Autorise les commits directs sur main uniquement
                         avec le profil simple et l'approbation spécifique.
  --approval DIRECT_MAIN_APPROVED
                         Approbation explicite requise avec
                         --allow-direct-main ; ne contourne pas les
                         protections GitHub.
  -h, --help             Affiche cette aide et quitte sans rien modifier.

EXEMPLES
  # Prévisualiser les choix du profil standard
  bash agent/scripts/init.sh --profile standard

  # Initialiser le projet pour les deux agents
  bash agent/scripts/init.sh --profile standard --write

  # Installer uniquement les Skills utiles à Codex
  bash agent/scripts/init.sh --profile simple --agent codex --write

  # Installer les 20 Skills
  bash agent/scripts/init.sh --profile standard --all-skills --write

  # Autoriser spécifiquement les commits directs sur main (profil simple)
  bash agent/scripts/init.sh --profile simple --allow-direct-main \
    --approval DIRECT_MAIN_APPROVED --write

IMPORTANT
  Après création du dépôt avec "Use this template", ajoute de préférence
  les fichiers de ta stack avant l'initialisation : sinon seuls les quatre
  Skills de base sont sélectionnés. --all-skills permet de tous les installer.

  Le script est en Bash : Python n'est pas nécessaire pour l'initialisation.
  Il ne génère pas l'application, n'installe aucune dépendance, ne crée pas
  de branche dev ou pre-prod, ni de PR, CI/CD applicative ou déploiement.
  Il ne configure pas automatiquement ChatGPT : il faut lui donner accès
  aux fichiers du référentiel et aux instructions du projet.
  Il refuse de remplacer des fichiers locaux différents et les liens
  symboliques suspects. Les Rules canoniques restent dans agent/rules/.
  Une fois l'installation effectuée, vérifie git status et git diff.
HELP
}
while (($#)); do
 case "$1" in
 --profile) (($#>=2)) || die 'Missing profile'; PROFILE="$2"; shift 2;;
 --agent) (($#>=2)) || die 'Missing agent'; AGENT="$2"; shift 2;;
 --all-skills) ALL=true; shift;;
 --write) WRITE=true; shift;;
 --allow-direct-main) DIRECT=true; shift;;
 --approval) (($#>=2)) || die 'Missing approval'; APPROVAL="$2"; shift 2;;
 --help|-h) show_help; exit 0;;
 *) die "Unknown option: $1";;
 esac
done
[[ -d "$SOURCE" && -f "$ROOT/AGENTS.md" ]] || die 'Missing source catalog'
[[ "$AGENT" == codex || "$AGENT" == claude || "$AGENT" == both ]] || die 'Invalid agent'
[[ -z "$PROFILE" || "$PROFILE" == simple || "$PROFILE" == standard || "$PROFILE" == production ]] || die 'Invalid profile'
[[ "$WRITE" != true || -n "$PROFILE" ]] || die 'Select --profile before --write'
if [[ "$DIRECT" == true ]]; then
 [[ "$PROFILE" == simple && "$APPROVAL" == DIRECT_MAIN_APPROVED ]] || die 'Direct main requires simple profile and explicit approval'
fi
# Discover root applications, immediate children, and common workspace folders.
# Do not scan dependencies, build output, hidden configuration or symlinked dirs.
skills=(project-rules-configurator github-workflow code-review security-audit)
add_skill() {
 local item="$1" existing
 for existing in "${skills[@]}"; do
  [[ "$existing" != "$item" ]] || return 0
 done
 skills+=("$item")
}
app_count=0
explicit_monorepo=false
detected=()
for dir in "$ROOT" "$ROOT"/*/ "$ROOT"/apps/*/ "$ROOT"/packages/*/ "$ROOT"/services/*/; do
 [[ -d "$dir" && ! -L "$dir" ]] || continue
 dir="${dir%/}"
 rel="."
 if [[ "$dir" != "$ROOT" ]]; then rel="${dir#"$ROOT"/}"; fi
 skip=false
 IFS='/' read -r -a parts <<<"$rel"
 for part in "${parts[@]}"; do
  case "$part" in
   agent|node_modules|vendor|dist|build|coverage|target|out|.git|.next|.nuxt|.dart_tool|.venv|venv|__pycache__|.agents|.claude|.github) skip=true ;;
  esac
  [[ "$part" != .* || "$part" == "." ]] || skip=true
 done
 [[ "$skip" == false ]] || continue
 local_stack=()
 app=false
 if [[ -f "$dir/composer.json" || -f "$dir/symfony.lock" ]]; then
  local_stack+=(Symfony)
  add_skill symfony-development
  add_skill api-testing
  add_skill database-migrations
  app=true
 fi
 if [[ -f "$dir/pubspec.yaml" ]]; then
  local_stack+=(Flutter)
  add_skill flutter-development
  add_skill ui-design
  app=true
 fi
 if [[ -f "$dir/package.json" ]]; then
  local_stack+=(Node.js)
  add_skill project-bootstrap
  app=true
  if grep -Eq '"@nestjs/core"[[:space:]]*:' "$dir/package.json"; then
   local_stack+=(NestJS)
   add_skill nestjs-development
   add_skill api-testing
   add_skill database-migrations
  fi
  if grep -Eq '"react"[[:space:]]*:' "$dir/package.json"; then
   local_stack+=(React)
   add_skill react-ui
   add_skill ui-design
  fi
 fi
 if [[ -f "$dir/compose.yaml" || -f "$dir/docker-compose.yml" || -f "$dir/Dockerfile" ]]; then
  local_stack+=(Docker)
  add_skill docker-setup
  add_skill docker-troubleshooting
  app=true
 fi
 if [[ -f "$dir/pnpm-workspace.yaml" || -f "$dir/lerna.json" ]]; then
  explicit_monorepo=true
 fi
 if [[ "$app" == true ]]; then
  ((app_count+=1))
  detected+=("$rel: ${local_stack[*]}")
 fi
done
if ((app_count>1)) || [[ "$explicit_monorepo" == true ]]; then
 add_skill monorepo-management
 detected+=("Monorepo ($app_count application(s))")
fi
if [[ "$ALL" == true ]]; then
 skills=()
 while IFS= read -r name; do skills+=("$name"); done < <(find "$SOURCE" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | LC_ALL=C sort)
fi
printf 'Detected stack:\n'
if (("${#detected[@]}"==0)); then
 printf '  - Aucun manifeste reconnu\n'
else
 printf '  - %s\n' "${detected[@]}"
fi
printf 'Profile: %s (recommendation: standard)\nSkills: %s\n' "$PROFILE" "${skills[*]}"
inventory="$(mktemp)"
trap 'rm -f "$inventory"' EXIT
safe() {
 local path="$1" cursor="$ROOT" part rel
 [[ "$path" == "$ROOT/"* ]] || die "Outside project: $path"
 rel="$(realpath -m --relative-to="$ROOT" "$path")"
 [[ "$rel" != ..* ]] || die "Outside project: $path"
 local -a pieces
 IFS='/' read -r -a pieces <<<"$rel"
 for part in "${pieces[@]}"; do
   cursor="$cursor/$part"
   [[ ! -L "$cursor" ]] || die "Symlink forbidden: $cursor"
 done
}
for name in "${skills[@]}"; do
 folder="$SOURCE/$name"
 [[ -f "$folder/SKILL.md" && ! -L "$folder" ]] || die "Missing Skill: $name"
 [[ -z "$(find "$folder" -type l -print -quit)" ]] || die "Symlink in Skill: $name"
 while IFS= read -r -d '' file; do
  [[ ! -L "$file" ]] || die "Unsafe source: $file"
  rel="$(realpath --relative-to="$SOURCE" "$file")"
  for agent in codex claude; do
   [[ "$AGENT" == both || "$AGENT" == "$agent" ]] || continue
   if [[ "$agent" == codex ]]; then dest="$ROOT/.agents/skills/$rel"; else dest="$ROOT/.claude/skills/$rel"; fi
   safe "$dest"
   if [[ -e "$dest" ]]; then
    [[ -f "$dest" ]] || die "Not a regular file: $dest"
    cmp -s "$file" "$dest" || die "Customized file, refusing overwrite: $dest"
   else
    printf '%s\t%s\n' "$file" "$dest" >> "$inventory"
   fi
  done
 done < <(find "$folder" -type f -print0)
done
policy="$ROOT/.agent/project-policy.yml"
safe "$policy"
policy_text=''
if [[ -n "$PROFILE" ]]; then
 if [[ "$PROFILE" == simple ]]; then issues=optional; branches=optional; prs=optional; else issues=required; branches=required; prs=required; fi
 policy_text="$(printf 'schema_version: 1\nprofile: %s\ngit:\n  issues: %s\n  branches: %s\n  pull_requests: %s\n  direct_main_commits: %s\n  base_branch: auto\ntesting:\n  run_existing_tests: true\ndeployment:\n  mode: none\nmetadata:\n  source: agent-rules\n  configured_with_explicit_approval: true\n' "$PROFILE" "$issues" "$branches" "$prs" "$DIRECT")"
 if [[ -e "$policy" ]]; then
  [[ -f "$policy" ]] || die 'Invalid existing policy'
  [[ "$(cat "$policy")" == "$policy_text" ]] || die 'Existing project policy differs; refusing overwrite'
 fi
fi
printf 'Planned new files: %s\n' "$(wc -l < "$inventory")"
if [[ "$WRITE" != true ]]; then echo 'PREVIEW ONLY; pass --profile and --write after review'; exit 0; fi
while IFS=$'\t' read -r file dest; do
 [[ -n "$dest" ]] || continue
 mkdir -p "$(dirname "$dest")"
 cp -n -- "$file" "$dest"
done < "$inventory"
if [[ -n "$policy_text" && ! -e "$policy" ]]; then
 mkdir -p "$(dirname "$policy")"
 (set -C; printf '%s\n' "$policy_text" > "$policy")
fi
echo 'Initialized; review git diff/status. No branch, PR or deployment created.'
