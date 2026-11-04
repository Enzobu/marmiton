# agent-rules — Template multi-agents

Un template GitHub de développement pour Codex, Claude Code et ChatGPT, avec **460 Rules**, **20 Skills** et initialisation **Bash**.

## Démarrage

Depuis un nouveau dépôt créé avec Use this template :

    # Prévisualisation sans écriture
    bash agent/scripts/init.sh --profile standard

    # Installation après vérification
    bash agent/scripts/init.sh --profile standard --write

L'initialiseur détecte la stack et propose les Skills pertinents. Aucun commit, merge, déploiement ni écrasement de configuration existante n'est autorisé par ce script.

## Architecture

    AGENTS.md
    CLAUDE.md
    README.md
    .github/
    .claude/rules/
    agent/
      rules/
      skills/
      scripts/
      docs/
      tests/
      templates/
      examples/
      chatgpt/

Les points d'entrée natifs restent à la racine. Le catalogue est centralisé dans **agent/**.

## Guides

- [Utiliser comme template GitHub](agent/docs/TEMPLATE.md)
- [Catalogue de Skills](agent/docs/SKILLS.md)
- [Chargement des Rules](agent/docs/RULES_LOADING.md)
- [CI](agent/docs/CI.md) et [CD Dokploy](agent/docs/CD.md)
- [Validations](agent/docs/VALIDATION.md)

Workflow par défaut : issue → branche de travail depuis dev si elle existe, sinon la branche par défaut → commits → PR. Toute dérogation doit être explicitement approuvée; aucune fusion ni mise en production implicite.

Le workflow GitHub Actions du template valide le référentiel et ne remplace pas la CI applicative d'un projet. Les modèles de CD sont inactifs.
