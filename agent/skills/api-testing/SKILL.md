---
name: api-testing
description: Maintient les collections API natives Postman ET Bruno, avec couverture des routes, erreurs et Bearer automatique sécurisé.
---

# api-testing

## Quand l'utiliser

Création, modification, test ou documentation d'API HTTP et de ses scénarios d'authentification.

## Règles à lire

- `rules/17-api-testing.md`
- `rules/05-testing.md`
- `rules/08-backend.md`

## Inspection initiale

1. Inventorier routes/méthodes à partir du code et d'OpenAPI disponible, ainsi que DTO, schémas de réponse, authentification et rôles.
2. Repérer les collections existantes et versions réellement utilisées des runners Postman et Bruno.
3. Vérifier l'URL locale, les credentials de test, le contrat du login et les formats importables pris en charge.

## Procédure

1. Maintenir les deux collections sous `testing/postman` et `testing/bruno` (ou arborescence par service), chacune avec un seul `<nomProjet>_local` par défaut.
2. Établir une matrice route × méthode × scénario × résultat : succès, validation, 401/403, 404, conflits et cas métier pertinents.
3. Pour Bearer, faire d'abord le login réel : Postman extrait avec `pm.response.json()` puis `pm.environment.set`; Bruno extrait avec `res.getBody()` puis `bru.setVar` **runtime**, jamais `bru.setEnvVar` pour les tokens.
4. Propager `{{accessToken}}` dans les requêtes protégées, nettoyer tokens invalides et traiter refresh/rôles seulement si l'API les expose.
5. Créer les assertions réellement exécutables dans les syntaxes natives distinctes; synchroniser collections et contrats dans le même diff.
6. Exécuter séparément les deux suites en local et CI si environnements/runners disponibles; fournir les nombres réussis/échoués/non exécutés.

## Critères de validation

- Couverture identique entre les deux outils sans se fier au simple export automatique.
- Aucun token réel ni credential dans les commits, exports ou logs.
- Login automatique avant les scénarios protégés; tests d'échec ne recyclent pas un token valide.

## Garde-fous

Ne jamais désactiver l'auth de l'API pour faire passer les tests ni utiliser les données de production. Si l'API ou un runner manque, marquer la suite non exécutée, jamais validée.

## Référence détaillée

Consulter [la procédure et la checklist](references/coverage.md).
