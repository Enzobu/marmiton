# CD Dokploy — guide d'intégration

Les [37 règles CD](../rules/19-cd.md) définissent la politique. Demander à l'utilisateur de choisir **production seulement** ou **préproduction + production** avant toute configuration.

## Déclencheurs et jobs

| Mode | Déclencheur | Job | GitHub Environment |
| --- | --- | --- | --- |
| Prod seule | Push de tag `vX.Y.Z` | `deploy-prod` | `production` |
| Préprod + prod | Push sur `pre-prod` | `deploy-pre-prod` | `pre-production` |
| Préprod + prod | Push de tag `vX.Y.Z` | `deploy-prod` | `production` |

Tous les jobs de CD ont `needs: ci-required` **dans le même workflow GitHub Actions**. Une référence à un job d'un autre workflow ne fonctionne pas. Configurer la CI du projet pour tourner aussi sur `pre-prod` (si utilisée) et les tags de release. Le statut sur le commit du tag doit être réellement vert. Aucun job de CI factice ne peut être ajouté.

## Fichiers modèles

- [Jobs Dokploy](../templates/dokploy/deploy-jobs.yml) : fragment YAML à intégrer au workflow applicatif existant, **non exécutable directement dans ce dépôt**.
- [Script de déclenchement](../scripts/dokploy_deploy.sh) : contrôle préflight de source, puis appel API Compose une seule fois, sans retries.
- [Checklist](DEPLOYMENT_CHECKLIST.md) : vérifications avant activation.

## GitHub Environments

Créer `production`, puis `pre-production` uniquement si demandé. Dans **chaque environnement**, enregistrer les deux secrets `DOKPLOY_API_KEY` et `DOKPLOY_COMPOSE_ID`, ainsi que les variables `DOKPLOY_URL` et `APP_HEALTH_URL`. Chaque projet possède ses propres credentials. Le modèle des jobs lit les valeurs après attribution de l'environnement, ce qui permet de réutiliser les noms dans chaque environnement. L'URL doit utiliser HTTPS. L'approbation manuelle de production est facultative et dépend du choix utilisateur et du plan GitHub.

## Point de sécurité essentiel : source exacte

L'endpoint `POST /api/compose.deploy` prend un `composeId` et déclenche la configuration **actuelle** dans Dokploy; il ne sélectionne pas automatiquement le tag GitHub. Le modèle commence par un `GET /api/compose.one` et exige que la branche de source Dokploy corresponde à la branche ou au tag attendu. Une production déclenchée par `v1.2.0` avec Dokploy configuré sur `main` est **bloquée**. Cette comparaison de nom est une **garde minimale, pas une attestation du commit exact** : pour une garantie forte, vérifier SHA/digest immuable par la stratégie propre au projet avant activation. Pour les projets basés sur une image immuable ou une autre source, adapter explicitement cette vérification, pas la supprimer silencieusement.

## Étapes du déploiement

1. Attendre la réussite de tous les jobs CI applicables sur le SHA courant.
2. Vérifier type de référence, paramètres, clé, Compose ID et source configurée.
3. Appeler une seule fois `POST /api/compose.deploy`, header `x-api-key`, JSON `{composeId: ...}` et `freshVolumes: false`.
4. Traiter HTTP 2xx comme **requête acceptée uniquement**. Ne pas afficher la réponse brute; ne pas retenter automatiquement un POST ambigu.
5. Pour pouvoir annoncer « déployé », corréler le nouveau déploiement avec les états Dokploy (ex. `GET /api/deployment.allByCompose` si suffisamment d'identifiants sont disponibles), puis vérifier santé et version du service. Le modèle de base n'effectue pas cette corrélation et **n'annonce donc jamais la réussite finale**.
6. Tracer la release, confirmer les éventuelles migrations et disposer d'un rollback manuel éprouvé.

## Vérification de complétion et de commit

Le script requiert `EXPECTED_COMMIT_SHA` (SHA du run CI) et `APP_VERSION_URL` (endpoint exposant `sha`, `commitSha` ou `gitSha`). Il exige un ID du **nouveau** déploiement retourné par Dokploy, attend son statut terminal via `deployment.allByCompose`, puis vérifie le SHA applicatif exact. Une absence d'ID, un schéma Dokploy non reconnu, une erreur ou une divergence de SHA font échouer le job. **L'intégrateur doit adapter et tester le parsing selon la version Dokploy installée avant toute activation.** Le nom de la branche ou du tag ne prouve pas seul le commit.

## Protection et activation

Protéger les tags et branches autorisés, utiliser permissions minimales, secrets d'environnement et une concurrence non annulable par environnement. Aucun push, tag, migration, appel Dokploy ou configuration réelle de projet n'est déclenché par ce dépôt de règles.
## Valeurs nécessaires dans le projet

Ajouter `APP_VERSION_URL` dans les variables GitHub Environment; les jobs transmettent `EXPECTED_COMMIT_SHA: github.sha`. Aucun modèle ne doit être activé tant que le statut du déploiement et le SHA versionné ne peuvent pas être vérifiés.

## Vérification du template avant activation

Les jobs de `templates/dokploy/deploy-jobs.yml` sont des fragments et non des workflows autonomes. Ils doivent être intégrés à une CI réelle qui s'exécute sur les tags, et l'instance Dokploy ciblée doit confirmer un schéma de déploiement corrélable. **Ne jamais retirer le contrôle de source, d'état ni de SHA** pour obtenir un job vert.
