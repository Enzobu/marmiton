---
name: github-ci
description: Construit une CI GitHub Actions complète, adaptée à la stack, avec gate ci-required et tests Postman/Bruno.
---

# github-ci

## Quand l'utiliser

Ajouter, corriger ou auditer les workflows de validation GitHub Actions d'un projet.

## Règles à lire

- `rules/18-ci.md`
- `rules/05-testing.md`
- `rules/17-api-testing.md`

## Inspection initiale

1. Inventorier scripts existants, langages, builds, lockfiles et services nécessaires aux tests.
2. Identifier les contrôles déjà requis par le dépôt et les branches réellement utilisées, sans inventer de `dev` ou `pre-prod`.
3. Identifier les API HTTP nécessitant Postman et Bruno, et les secrets de test.

## Procédure

1. Concevoir les jobs par stack pour lint/format, types/analyse statique, unitaires, intégration, E2E, builds et sécurité.
2. Configurer des déclencheurs PR/push pertinents, des permissions minimales et des actions épinglées, avec une concurrence sûre.
3. Pour les API HTTP, lancer **les deux** runners Postman et Bruno sur l'API locale avec leur environnement `<nomProjet>_local`; ne pas marquer comme réussi un runner absent.
4. Activer SonarQube seulement si configuré, avec secrets appropriés et résultat pris en compte selon la politique du dépôt.
5. Créer un unique job final `ci-required` qui attend tous les jobs obligatoires et échoue en cas de failed/skipped inattendu.
6. Valider le YAML, les expressions GitHub et les workflows de fork/PR ; déclencher si possible une exécution réelle et contrôler son statut.

## Critères de validation

- Les jobs ne se déclarent pas réussis lorsqu'un test est ignoré; pas de job placeholder qui prétend protéger la CD.
- Les environnements et services de test sont isolés et n'utilisent pas de données de production.
- La CI de la PR donne un résultat réel observé et traçable.

## Garde-fous

Une CI ne déploie jamais. Ne pas modifier les branch protections ou secrets du dépôt sans autorisation et accès; signaler toute validation non exécutable.

## Référence détaillée

Consulter [la procédure et la checklist](references/pipeline.md).
