# testing

> Référentiel canonique. Les identifiants sont stables. Appliquer chaque règle lorsqu'elle est pertinente, sauf si une consigne explicite autorisée prévaut.

## T01 — Batterie complète

Exécuter toutes les vérifications applicables configurées: tests unitaires, intégration, E2E, lint, format, analyse statique, typecheck et build.

## T02 — Test de bug

Ajouter un test de non-régression reproduisant la cause lorsqu'un harnais existe.

## T03 — Unitaires

Couvrir les invariants et branches métier importantes.

## T04 — Intégration

Tester les interactions significatives entre composants et persistance.

## T05 — E2E

Exécuter l'intégralité de la suite E2E disponible, et ajouter parcours affectés si pertinent.

## T06 — Déterminisme

Contrôler horloge, fixtures, random et réseau lors des tests.

## T07 — Pas de skip artificiel

Ne pas désactiver des tests pour obtenir du vert.

## T08 — Mocks raisonnés

Mocker frontières externes sans remplacer le comportement testé.

## T09 — Limites

Tester vides, null, invalides, volumes et erreurs.

## T10 — Compilation

Exécuter tous les builds/compilations configurés.

## T11 — Lint

Exécuter tous les linters existants.

## T12 — Format

Vérifier le formatter existant sans reformatter tout le dépôt.

## T13 — Couverture mesurée

N'annoncer que les métriques effectivement calculées.

## T14 — Assertions utiles

Privilégier tests de comportement et non taux artificiel.

## T15 — Impossible explicite

Lister commandes non exécutées avec raison; ne pas appeler la batterie « validée ».

## T16 — Régressions

Différencier erreurs préexistantes et erreurs introduites.

## T17 — Permissions

Tester accès autorisés/interdits et ownership sur parcours sensibles.

## T18 — Migrations

Tester les migrations sur une base non productive.

## T19 — Attendus fiables

Ne pas changer les assertions pour masquer un défaut.

## T20 — Risque et effort

La batterie existante reste complète; nouveaux tests choisis en fonction des risques.

## T21 — Collections Postman + Bruno obligatoires pour les API HTTP

Lorsqu'une API HTTP est créée ou modifiée, appliquer **toutes** les règles [AT01–AT32](17-api-testing.md). Ajouter `testing/postman` et `testing/bruno` avec les collections et **un seul environnement par outil** nommé `<nomProjet>_local`. Couvrir scénarios nominaux et erreurs, puis exécuter les deux suites dans la batterie complète. Aucune simple documentation OpenAPI ne remplace ces collections.
