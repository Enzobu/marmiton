# Checklist workspaces

1. Lire la racine, le lockfile, le fichier workspace et les scripts déclarés.
2. Repérer tous les packages concernés, y compris les consommateurs de contrats partagés.
3. Contrôler DTO, REST/OpenAPI, WebSocket, MQTT, DB et versions des packages.
4. Modifier et tester le producteur ainsi que les consommateurs.
5. Utiliser uniquement le gestionnaire existant, dans le répertoire correct.
6. Mettre à jour les collections Postman + Bruno si une API HTTP change.
7. Ne pas introduire de nouveaux volumes Docker gérés pour les services du monorepo.

## Exemples de commandes selon le dépôt

- pnpm --filter PACKAGE test
- pnpm --filter PACKAGE build
- pnpm -r test

N'exécuter que les scripts effectivement définis : ces commandes sont des exemples, non des tests réalisés.
