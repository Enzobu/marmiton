# Procédure API — Postman / Bruno

## Arborescences

Postman : `testing/postman/<nomProjet>.postman_collection.json` et `<nomProjet>_local.postman_environment.json`.
Bruno : fichiers natifs `testing/bruno` au format OpenCollection YAML **ou** BRU selon la version installée, avec un environnement `<nomProjet>_local`.

## Authentification automatique

- Lire `docs/API_AUTH.md` et les scripts `examples/api-auth/postman-login.js` et `examples/api-auth/bruno-login.js`.
- Postman : `pm.environment.set("accessToken", value)`, sans export de secret.
- Bruno : `bru.setVar("accessToken", value)` en mémoire; l'API `bru.setEnvVar` peut persister le secret dans les versions récentes.
- Associer les noms de variables entre outils sans copier du code JavaScript incompatible.
- Les tests `401` sans token doivent explicitement neutraliser l'auth; les tests `403` utilisent un rôle vraiment insuffisant.

## Matrice minimale

| Endpoint | Nominal | Validation | Auth | Permissions | Cas métier |
| --- | --- | --- | --- | --- | --- |
| `POST /auth/login` | token | mot de passe invalide | public | n/a | jeton non vide |
| `GET /resources` | liste | filtres invalides | 401 | 403 si applicable | pagination |
| `POST /resources` | création | payload invalide | 401 | 403 si applicable | conflit |

Ne jamais inventer des routes ou codes HTTP réels à partir de cet exemple.

