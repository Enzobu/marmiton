---
paths:
  - "**/Dockerfile*"
  - "**/compose*.yaml"
  - "**/compose*.yml"
  - "**/docker-compose*.yaml"
  - "**/docker-compose*.yml"
---

# Docker

Lire `agent/rules/10-docker.md`; pas de `version` dans Compose, `restart: unless-stopped` par défaut. Pour `.env` et volumes lire aussi `agent/rules/20-environment.md`. Les règles CI/CD sont définies dans `agent/rules/18-ci.md` et `agent/rules/19-cd.md`. Aucun volume Docker géré, y compris temporaire.
