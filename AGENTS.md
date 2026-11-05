# Instructions multi-agents — Codex

**Chargement contextuel :** lire le socle `agent/rules/01-agent.md`, `agent/rules/02-git.md`, `agent/rules/03-github.md`, `agent/rules/04-quality.md`, `agent/rules/06-security.md`; ne consulter les autres règles que si la tâche les concerne. Voir `agent/rules/25-governance.md` et `agent/docs/RULES_LOADING.md`. Les documents sont des instructions de travail, pas seulement des suggestions.

## Décisions prioritaires

- Par défaut, **créer ou reprendre une issue GitHub, créer une branche dédiée depuis dev si elle existe (sinon branche par défaut), effectuer le travail, committer puis ouvrir une PR non draft**.
- **Ne jamais merger une PR sans demande explicite**, même si les validations réussissent. Ne jamais déployer automatiquement.
- **Exécuter la batterie complète** de tests unitaires, intégration, E2E, lint, format, analyse statique, typecheck et build disponibles. Documenter ce qui ne peut être exécuté; ne jamais inventer de succès.
- Protéger les secrets, les modifications locales et les données réelles. Aucune action destructive, force push ou suppression de données implicite.
- Respecter les conventions et fonctions existantes; fournir liens issue, branche et PR et un compte rendu des tests.
- **CI autorisée et attendue** : lire `agent/rules/18-ci.md` et `agent/docs/CI.md` pour standardiser GitHub Actions (qualité, tests complets, sécurité, builds et contrôle final). **CD Dokploy** : lire `agent/rules/19-cd.md` et `agent/docs/CD.md`. Avant configuration, demander production seule ou production + préproduction; ne jamais déclencher un déploiement réel depuis ce dépôt.

Lire [agent/docs/INSTALLATION.md](agent/docs/INSTALLATION.md) pour la portée et l'adoption dans d'autres dépôts.

## Obligatoire pour toute API HTTP

Lire **`agent/rules/17-api-testing.md`** : générer/maintenir `testing/postman` et `testing/bruno` avec collections natives, un seul environnement `<nomProjet>_local` par outil, **Bearer automatique** (Postman `pm.environment.set`, Bruno `bru.setVar` sans écriture de tokens sur disque), cas nominaux et erreurs, assertions exécutables et exécution intégrale locale des deux suites. Signaler toute impossibilité.

## GitHub post-merge et stockage persistant

Après tout merge **confirmé et autorisé**, fermer les issues effectivement terminées, puis supprimer les branches de travail mergées sans toucher aux branches protégées : `agent/rules/03-github.md` (H15/H18) et `agent/rules/02-git.md` (G20). Pour tout Docker/Dokploy, appliquer `agent/rules/20-environment.md` et `agent/docs/ENVIRONMENT.md` : aucun volume Docker persistant nommé/anonyme, tous les bind mounts hôtes déclarés dans `.env.example`, convention Dokploy `/etc/dokploy_volume/<APP>/...`.

Pour une release, lire `agent/rules/21-release.md`; une UI, `agent/rules/22-ui-validation.md`; un monorepo, `agent/rules/23-monorepo.md`; une intervention opérationnelle, `agent/rules/24-operations.md`. Toujours consulter les conventions locales du dépôt cible.

## Politique locale et Skills

**Avant d'appliquer les obligations Git/GitHub**, consulter dans le projet cible `.agent/project-policy.yml` s'il existe. Seules les exceptions de workflow explicitement approuvées (issues, branche, PR, commit direct sur main) peuvent remplacer les valeurs par défaut G01–G05/H01/H06; aucune exception ne lève les protections GitHub, les exigences de tests, de sécurité ou l'autorisation spécifique pour merge/déploiement. Voir `agent/skills/project-rules-configurator/SKILL.md` et `agent/docs/SKILLS.md`. Pour toute création/refonte visuelle, consulter `agent/skills/ui-design/SKILL.md`; vérifier les captures réellement accessibles et les rendus avant/après si les outils le permettent. Les chemins Skills ne garantissent pas une installation native dans chaque agent.

## Routage des 20 Skills

Pour les procédures disponibles, lire [agent/docs/SKILLS.md](agent/docs/SKILLS.md) et uniquement le `agent/skills/<nom>/SKILL.md` pertinent. Workflows : `github-workflow`, `api-testing`, `docker-setup`, `github-ci`, `dokploy-cd`, `project-bootstrap`, `code-review`, `release-management`. Spécialistes : `symfony-development`, `nestjs-development`, `react-ui`, `flutter-development`, `database-migrations`, `docker-troubleshooting`, `monorepo-management`. L'agent doit disposer des fichiers réels ; la simple référence n'installe pas un Skill. La politique locale `.agent/project-policy.yml` approuvée reste prioritaire sur les seules conventions Git par défaut.

À ajouter aux Skills spécialisés disponibles : `dependency-upgrade`, `security-audit`, `performance-audit`. Avant d'exécuter plusieurs Skills, lire `agent/docs/SKILL_ORCHESTRATION.md` pour la coordination, les autorisations et l'absence de double exécution. Les Skills installés dans `.agents/agent/skills/` restent subordonnés aux Rules et à la politique locale approuvée.

## Template GitHub — organisation V3

Les ressources du référentiel sont centralisées dans `agent/` (`agent/rules/`, `agent/skills/`, `agent/scripts/`, `agent/docs/`, `agent/tests/`). Les fichiers natifs `AGENTS.md`, `CLAUDE.md`, `.claude/rules/` et `.github/workflows/` restent à la racine. Pour initialiser un dépôt créé depuis ce template : `bash agent/scripts/init.sh --profile standard` (prévisualisation), puis ajouter `--write` après validation. **Aucun Python nécessaire à cette initialisation**. Lire [le guide](agent/docs/TEMPLATE.md).

## Workflow spécifique au dépôt Marmiton

La politique approuvée de ce dépôt est dans `.agent/project-policy.yml` (voir aussi `WORKFLOW.md`). Ne pas modifier les Rules/Skills canoniques pour ces choix locaux.

- `main` = production ; `dev` = intégration ; toute branche de fonctionnalité part de `dev` et ouvre une PR vers `dev`.
- Le propriétaire autorise à l'avance la fusion des PR de feature **sur `dev` uniquement**, après réussite de tous les contrôles requis, absence de conflit et revue des différences. Cette exception locale précise l'autorisation de merge G19/H18; ne jamais contourner une protection GitHub.
- Chaque promotion `dev` → `main` exige une PR et une autorisation explicite distincte, même si la CI est verte. Ne jamais committer directement sur `main`.
- Une fois configurée et activée, la CD production sera déclenchée uniquement sur un merge/push de `main`, jamais sur `dev`. Aucun déploiement réel sans secrets Dokploy, vérification du SHA et contrôles de santé opérationnels.
- Après merge confirmé vers `dev`, fermer les issues réellement terminées et nettoyer les branches de features intégrées selon G20/H15.
