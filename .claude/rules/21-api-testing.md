---
paths:
  - "testing/postman/**/*"
  - "testing/bruno/**/*"
  - "**/controllers/**/*"
  - "**/routes/**/*"
  - "**/*controller*.{ts,js,php}"
  - "**/*Controller*.{ts,js,php}"
  - "**/openapi*.{yaml,yml,json}"
---

# Testing API HTTP

Lire intégralement `agent/rules/17-api-testing.md` et conserver **Postman et Bruno** à jour à chaque modification d'API : collections importables, environnement unique `<nomProjet>_local` par outil, cas nominaux et erreurs et assertions réellement exécutables. Ces filtres ne remplacent pas l'obligation de lecture du fichier pour toute tâche d'API, y compris hors chemins listés.

Pour chaque API Bearer, lire aussi `agent/docs/API_AUTH.md` : login et capture automatiques du jeton, stockage Postman dans l'environnement actif, Bruno avec `bru.setVar` **en mémoire** (ne jamais utiliser `bru.setEnvVar` pour des tokens), intégration aux deux runners et vérification 401/403.
