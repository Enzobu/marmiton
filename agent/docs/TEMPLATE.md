# Utiliser agent-rules comme template GitHub

Ce dépôt est une base de projet : points d'entrée agents à la racine et référentiel canonique dans agent/.

## Nouveau dépôt

1. Sur GitHub, activer si nécessaire **Template repository**, puis utiliser **Use this template**.
2. Cloner le nouveau dépôt et préparer les fichiers de stack si disponibles.
3. Prévisualiser avec la commande :

    bash agent/scripts/init.sh --profile standard

4. Après vérification, initialiser :

    bash agent/scripts/init.sh --profile standard --agent both --write

Le script est **entièrement Bash** et fonctionne sans Python. Les profils sont simple, standard et production. Par défaut, seuls les Skills adaptés à la stack détectée sont copiés. L'option --all-skills installe les vingt Skills, --agent codex ou --agent claude limite la cible.

Une exception de commit direct main exige --profile simple, --allow-direct-main et --approval DIRECT_MAIN_APPROVED. Elle ne contourne jamais les protections de branches GitHub.

Aucune création automatique de branche dev, de préproduction, de PR, de commit, d'installation de dépendances ou de déploiement. Le script travaille en simulation par défaut et refuse les symlinks ainsi que toute modification de fichier existant divergent.

## Structure

    AGENTS.md
    CLAUDE.md
    README.md
    .github/workflows/ci.yml
    .claude/rules/
    agent/
      rules/
      skills/
      scripts/init.sh
      scripts/sync_skills.py
      docs/
      examples/
      templates/
      tests/
      chatgpt/

## Portée et synchronisation

Le point d'entrée Codex est AGENTS.md, celui de Claude Code est CLAUDE.md, et les règles natives Claude demeurent sous .claude/rules. Les Rules et Skills canoniques sont dans agent/. Les copies natives des Skills sont installées dans .agents/skills et .claude/skills.

ChatGPT n'installe pas automatiquement ces Skills depuis un lien GitHub. Mettre les fichiers à sa disposition et lire le document agent/chatgpt/PROJECT_INSTRUCTIONS.md.

Pour les mises à jour ultérieures, le synchroniseur Python historique reste facultatif :

    python3 agent/scripts/sync_skills.py --target .

L'init Bash ne remplace pas un Skill existant divergent. Le synchroniseur Python dispose en outre d'un suivi SHA-256 pour les mises à jour.

## CI

Le workflow présent à la racine est la CI documentaire du template et **n'est pas la CI applicative** d'un futur projet. Adapter une CI réelle avec le Skill github-ci selon la stack; les modèles Dokploy restent inactifs.

## Tests de la bibliothèque

    bash -n agent/scripts/init.sh
    bash agent/tests/test_init.sh
    python3 agent/scripts/validate_repository.py
    python3 agent/scripts/validate_skills.py
