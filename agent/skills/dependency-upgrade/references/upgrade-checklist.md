# Mise à jour de dépendances : matrice

| Champ | Valeur à renseigner |
| --- | --- |
| Package | Nom, gestionnaire et rôle direct/transitif |
| Version actuelle | Valeur du lockfile réel |
| Version cible | Version vérifiée et source |
| Risque | Breaking changes, EOL, CVE documentée, peer deps |
| Code | Imports, API, build, schéma et configuration à adapter |
| Tests | Commandes exécutées, échecs préexistants ou nouveaux |
| Rollback | Commit et lockfile précédents |

## Procédure par niveau

- PATCH : lire changelog, vérifier incompatibilités, tester.
- MINOR : vérifier nouveaux prérequis et comportements.
- MAJOR : planifier migration par étapes, compatibilité runtime, clients et dépendances transitives.
- Alerte sécurité : vérifier la vulnérabilité auprès d'une source fiable; ne pas confondre « package obsolète » et faille exploitable.

Conserver les lockfiles et éviter les mises à jour massives hors contexte.
