# Skills — agent-rules

Les **Rules** (`rules/*.md`) indiquent les obligations; les **Skills** (`skills/<nom>/SKILL.md`) décrivent des procédures réutilisables et leurs outils.

| Skill | Usage |
| --- | --- |
| [project-rules-configurator](../skills/project-rules-configurator/SKILL.md) | Politique Git/GitHub locale simple, standard ou production |
| [github-workflow](../skills/github-workflow/SKILL.md) | Cycle issue → branche → PR → merge autorisé → nettoyage |
| [api-testing](../skills/api-testing/SKILL.md) | Postman et Bruno natifs, scénarios, auth Bearer automatique |
| [docker-setup](../skills/docker-setup/SKILL.md) | Dockerfile, Compose, `.env.example`, bind mounts et checks |
| [github-ci](../skills/github-ci/SKILL.md) | GitHub Actions multi-stack et gate `ci-required` |
| [dokploy-cd](../skills/dokploy-cd/SKILL.md) | CD Dokploy avec preuve de statut terminal et SHA |
| [project-bootstrap](../skills/project-bootstrap/SKILL.md) | Initialisation du dépôt, conventions et environnement local |
| [code-review](../skills/code-review/SKILL.md) | Analyse de diff, risques, contrats, régressions et tests |
| [release-management](../skills/release-management/SKILL.md) | Versions, promotions, tags, hotfix, rollback |
| [ui-design](../skills/ui-design/SKILL.md) | UI depuis une référence ou refonte et comparaison visuelle |
| [symfony-development](../skills/symfony-development/SKILL.md) | Services Symfony, Doctrine, permissions, Twig/UX |
| [nestjs-development](../skills/nestjs-development/SKILL.md) | DTO, Guards, Prisma, contrats API et tests |
| [react-ui](../skills/react-ui/SKILL.md) | UI React/Vite et non-régression visuelle |
| [flutter-development](../skills/flutter-development/SKILL.md) | Flutter, thèmes, navigation, permissions et notifications |
| [database-migrations](../skills/database-migrations/SKILL.md) | Migrations SQL/Doctrine/Prisma sûres et testables |
| [docker-troubleshooting](../skills/docker-troubleshooting/SKILL.md) | Diagnostic stockage, réseau, logs et santé des conteneurs |
| [monorepo-management](../skills/monorepo-management/SKILL.md) | Workspaces, dépendances, contrats interservices |

| [dependency-upgrade](../skills/dependency-upgrade/SKILL.md) | Versions, migrations et compatibilité des dépendances |
| [security-audit](../skills/security-audit/SKILL.md) | Secrets, permissions, auth et vulnérabilités vérifiées |
| [performance-audit](../skills/performance-audit/SKILL.md) | Profiling et optimisations mesurées avec baseline |

## Les 20 Skills

Les trois audits supplémentaires couvrent les dépendances, la sécurité et les performances. Les huit premiers workflows couvrent GitHub, API, Docker, CI/CD, bootstrap, revue et release. Les sept spécialistes couvrent Symfony, NestJS, React, Flutter, migrations DB, dépannage Docker et monorepos. Les deux Skills déjà livrés (`project-rules-configurator` et `ui-design`) restent des points d'entrée spécifiques pour configurer un projet et l'apparence de ses interfaces.

**Chaque Skill** contient une procédure et une checklist/référence opérationnelle ; les règles canoniques restent dans `rules/` sans duplication intégrale.

## Découverte des Skills

- **Codex** : conserver `AGENTS.md`, et rendre accessibles les `skills/<nom>/SKILL.md`. Pour une découverte native, installer les Skills dans l'emplacement reconnu par la version du client. Un lien dans ce dépôt n'assure pas un chargement automatique.
- **Claude Code** : conserver `CLAUDE.md` et les règles `.claude/rules/`. Installer ou lier chaque Skill dans l'emplacement de Skills pris en charge par la version courante (par exemple `.claude/skills/<nom>/SKILL.md` lorsque supporté). L'existence de `skills/` seule ne garantit rien.
- **ChatGPT** : les instructions du projet peuvent faire référence aux fichiers, mais leur accès dépend des fichiers et connecteurs réellement disponibles. Ne pas prétendre que les Skills sont automatiquement installés depuis GitHub.

## Configuration de workflow

Le configurateur produit dans **le projet cible** `.agent/project-policy.yml` après accord. La politique adapte uniquement les règles de workflow Git/GitHub pour ce projet; elle ne supprime jamais les tests existants, la sécurité, les protections GitHub ni les autorisations nécessaires à une action sensible.

Exemple de simulation :

```bash
python3 agent/skills/project-rules-configurator/scripts/configure.py --repo . --profile simple
```

Écriture après autorisation explicite :

```bash
python3 agent/skills/project-rules-configurator/scripts/configure.py --repo . --profile standard --approval POLICY_APPROVED --write
```

Commit direct sur main **uniquement** après approbation spécifique :

```bash
python3 agent/skills/project-rules-configurator/scripts/configure.py --repo . --profile simple --allow-direct-main --approval DIRECT_MAIN_APPROVED --write
```

## Validation

```bash
python3 agent/scripts/validate_skills.py
python3 -m unittest discover -s agent/tests -p 'test_skill_*.py' -v
```

Ces tests couvrent les 20 métadonnées de Skills, leurs références, la sécurité du configurateur et le catalogue complet. Ils ne prouvent pas la découverte des Skills par chacun des agents ou un rendu UI réel. Tester ces aspects sur un projet pilote.

## Installation et synchronisation vérifiables

Le synchroniseur local [scripts/sync_skills.py](../scripts/sync_skills.py) installe les dossiers complets des Skills, références et scripts inclus, dans les chemins natifs : Codex `.agents/skills/<nom>` et Claude Code `.claude/skills/<nom>`. **ChatGPT n'est pas pris en charge par ce script comme emplacement de découverte automatique** : utiliser les fichiers fournis au projet et ses capacités réellement disponibles.

```bash
python3 agent/scripts/sync_skills.py --target /chemin/projet
python3 agent/scripts/sync_skills.py --target /chemin/projet --agent codex --skills ui-design react-ui --write
python3 agent/scripts/sync_skills.py --target /chemin/projet --agent both --write
```

Sans `--write`, aucune modification. Le manifeste `.agent/skills-lock.json` stocke des empreintes SHA-256 des fichiers installés, **pas des secrets**. Une mise à jour refuse de modifier un fichier local divergent, un fichier non géré de contenu différent ou un lien symbolique; aucun nettoyage automatique des anciens Skills. Le script ne copie pas les règles globales ni les instructions agents, qu'il faut distribuer et versionner séparément. Exécuter un `git diff` avant commit.

Voir [l'orchestration](SKILL_ORCHESTRATION.md) pour coordonner plusieurs Skills sans actions implicites.

## Politique de projet paramétrable

Le configurateur accepte `--issues-policy`, `--branches-policy` et `--pr-policy` pour ajuster séparément la politique issue/branche/PR, sans supprimer les validations existantes ni la protection des données.

```bash
python3 agent/skills/project-rules-configurator/scripts/configure.py --repo /chemin/projet --profile simple --issues-policy required --pr-policy optional
```

La prévisualisation est toujours sans écriture; préciser `--write --approval POLICY_APPROVED` seulement après décision explicite.

## Template V3 : initialisation Bash

Pour un dépôt dérivé, préférer [le guide d'initialisation](TEMPLATE.md) :

```bash
bash agent/scripts/init.sh --profile standard
bash agent/scripts/init.sh --profile standard --write
```

Le script Bash installe les Skills adaptés au stack détecté, **sans dépendance Python**. Le synchroniseur historique Python sert aux mises à jour SHA-256 ultérieures. Les Rules canoniques restent dans `agent/rules/` ; les points d'entrée `AGENTS.md` et `CLAUDE.md` restent à la racine.
