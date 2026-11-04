---
name: dokploy-cd
description: Configure une CD Dokploy sécurisée prod seule ou préprod plus prod après CI avec vérification de la version déployée.
---

# dokploy-cd

## Quand l'utiliser

Activation ou refonte d'un déploiement automatisé Dokploy depuis GitHub Actions.

## Règles à lire

- `rules/19-cd.md`
- `rules/18-ci.md`
- `rules/20-environment.md`
- `rules/21-release.md`

## Inspection initiale

1. Demander le mode **production seule** ou **préproduction + production**; ne jamais créer pre-prod implicitement.
2. Identifier le type de déploiement Dokploy (Compose/autre), les branches/tags, la CI du projet et les méthodes de preuve de SHA/version.
3. Inspecter la configuration des sauvegardes et migrations, sans toucher aux données.

## Procédure

1. Configurer les GitHub Environments isolés `production` et éventuellement `pre-production`, avec secrets `DOKPLOY_API_KEY`, `DOKPLOY_COMPOSE_ID` et variables `DOKPLOY_URL`/`APP_VERSION_URL`.
2. Adapter `templates/dokploy/deploy-jobs.yml` à **la vraie CI de l'application** et inclure `needs: ci-required` dans le **même workflow**.
3. Pour la production, valider le tag de version; pour préprod, cibler la branche choisie et la CI du SHA correspondant.
4. Adapter le script `scripts/dokploy_deploy.sh` à l'API Dokploy **réellement disponible**; il doit échouer en cas d'identifiant de déploiement absent ou de statut non corrélable.
5. Après le trigger, confirmer l'état terminal du **nouveau** déploiement, effectuer un contrôle de santé et comparer le SHA applicatif à celui de la CI.
6. Documenter rollback et migrations; tester d'abord sur une application ou un environnement non productif, sans déclencher le réel dans ce dépôt.

## Critères de validation

- La CI complète du même commit est verte et la CD ne la contourne jamais.
- La réponse HTTP initiale n'est pas présentée comme un déploiement terminé.
- L'environnement, le SHA, les états et la stratégie de rollback sont traçables sans fuite de secrets.

## Garde-fous

Ne jamais supposer que le script générique est compatible avec toute version de Dokploy : adapter schémas et preuve de version avant activation. Pas de déploiement de production ni migration sans demande explicite.

## Référence détaillée

Consulter [la procédure et la checklist](references/deployment-checklist.md).
