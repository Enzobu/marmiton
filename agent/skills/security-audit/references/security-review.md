# Checklist audit de sécurité

| Domaine | Vérifications |
| --- | --- |
| Secret | .env hors Git, pas de token dans commit ou logs |
| Authn | durée de vie des sessions, absence de bypass, hash mots de passe |
| Authz | contrôle des rôles, ownership, tenant, 401/403 |
| Entrées | DTO, requêtes paramétrées, upload, taille/format |
| Navigateur | XSS/CSRF, cookies, CORS, CSP selon architecture |
| Réseau | TLS, exposition Docker, SSRF, endpoints internes |
| CI | least privilege, secrets, actions épinglées, branches protégées |
| Dépendances | avis et versions vérifiés, correctifs disponibles |
| Exploitation | sauvegardes, alertes, journaux sans données privées |

## Rapport

Pour chaque finding : criticité, code/ligne ou configuration, scénario démontré de manière sûre, risque, correction, test attendu et statut « confirmé / probable / non vérifié ».

Ne jamais publier de jeton ou contenu confidentiel, même comme preuve.
