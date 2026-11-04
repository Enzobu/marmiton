# Checklist release

| Étape | Condition |
| --- | --- |
| Version | MAJOR/MINOR/PATCH justifié par changements réels |
| Base Git | branche de production et commit identifiés |
| Validation | CI complète verte sur commit prévu |
| Notes | PR, correctifs, breaking changes, migration |
| Sauvegarde | sauvegardes et restauration disponibles pour changements risqués |
| Tag | `vMAJOR.MINOR.PATCH` demandé explicitement, SHA vérifié |
| Déploiement | app versionnée/healthcheck et état terminal, pas un simple 2xx |
| Hotfix | branche adaptée, test, propagation aux branches de travail |
| Rollback | version précédente, procédure et limites de migration |

Ne pas imposer l'existence de `dev` ou `pre-prod` à un dépôt configuré en mode simple.

