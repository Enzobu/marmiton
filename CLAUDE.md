# Instructions Claude Code

Lire [AGENTS.md](AGENTS.md) puis le socle des règles `01-agent`, `02-git`, `03-github`, `04-quality`, `06-security`, et seulement les règles spécialisées utiles, selon `agent/rules/25-governance.md` et `agent/docs/RULES_LOADING.md`.

**Rappels :** issue + branche + PR par défaut, `dev` si présent, **pas de merge sans demande**, batterie complète des contrôles, protection des données et secrets, CI selon `agent/rules/18-ci.md`, CD Dokploy selon `agent/rules/19-cd.md` et `agent/docs/CD.md` uniquement sur demande et après choix des environnements.

Les règles natives sous `.claude/agent/rules/` facilitent la découverte par Claude Code. Le présent dépôt doit être copié ou explicitement mis à disposition dans chaque projet cible.

Pour tout code d'API HTTP, lire **`agent/rules/17-api-testing.md`** et maintenir les collections **Postman + Bruno** et leurs environnements `<nomProjet>_local`. Pour les APIs Bearer, appliquer `agent/rules/17-api-testing.md` (AT23–AT32) et `agent/docs/API_AUTH.md` : login automatique, Postman `pm.environment.set`, Bruno `bru.setVar` en runtime.

Toute intervention de CI implique la lecture de `agent/rules/18-ci.md` et `agent/docs/CI.md`.

Après merge confirmé, fermer les issues terminées et supprimer les branches de travail mergées selon G20/H15. Pour tout Docker/Dokploy et `.env`, lire `agent/rules/20-environment.md` et `agent/docs/ENVIRONMENT.md` : bind mounts hôtes uniquement pour la persistance, chemins dans `.env.example`, convention `/etc/dokploy_volume/<APP>/...`.

Avant chaque intervention dans un projet consommateur, lire sa `.agent/project-policy.yml` si présente; les exceptions de workflow approuvées prévalent uniquement sur les règles Git par défaut, jamais sur les protections, tests ou autorisations de merge/déploiement. Skills : `agent/skills/project-rules-configurator/SKILL.md` et `agent/skills/ui-design/SKILL.md`, voir `agent/docs/SKILLS.md`; les installer dans l'emplacement reconnu par la version de Claude Code utilisée, ou lire les fichiers explicitement.

Pour sélectionner l'un des **20 Skills** (workflow ou stack), lire `agent/docs/SKILLS.md` puis `agent/skills/<nom>/SKILL.md` et sa référence. Installer dans le mécanisme de découverte des Skills de la version de Claude Code si nécessaire ; ne jamais présumer qu'un lien suffit.

Pour une intervention nécessitant plusieurs Skills, lire `agent/docs/SKILL_ORCHESTRATION.md`. Les Skills disponibles incluent aussi `dependency-upgrade`, `security-audit` et `performance-audit`, distribuables dans `.claude/agent/skills/` via `scripts/sync_skills.py`.

Organisation template : toutes les ressources canoniques sont dans `agent/`; lire `agent/docs/TEMPLATE.md`. Initialisation par `bash agent/scripts/init.sh --profile standard` et installation native dans `.claude/skills/` après `--write`.
