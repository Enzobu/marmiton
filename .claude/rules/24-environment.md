---
paths:
  - "**/compose*.yaml"
  - "**/compose*.yml"
  - "**/docker-compose*.yaml"
  - "**/docker-compose*.yml"
  - "**/.env.example"
  - "**/Dockerfile*"
---

# Configuration et volumes Docker

Lire `agent/rules/20-environment.md`, `agent/rules/10-docker.md` et `agent/docs/ENVIRONMENT.md` pour tout changement d'environnement ou de conteneurisation. Aucun volume Docker géré, nommé ou anonyme, même temporaire; seulement des bind mounts avec chemins hôtes présents dans `.env.example`, sous `/etc/dokploy_volume/<APP>/...` par défaut pour Dokploy. Ne jamais déplacer les données ni modifier les sauvegardes de l'hôte sans accord.
