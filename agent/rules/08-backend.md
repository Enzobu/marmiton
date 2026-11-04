# backend

> Référentiel canonique. Les identifiants sont stables. Appliquer chaque règle lorsqu'elle est pertinente, sauf si une consigne explicite autorisée prévaut.

## B01 — HTTP

Respecter routes, verbes, status et contrats existants.

## B02 — DTO

Valider et transformer les entrées avec le mécanisme du framework.

## B03 — Contrôleurs fins

Isoler métier et orchestration dans services/cas d'usage.

## B04 — Erreurs uniformes

Utiliser le format d'erreurs public établi.

## B05 — Permissions

Vérifier authn/authz et ownership par endpoint.

## B06 — Pagination

Borner les collections potentiellement larges.

## B07 — Filtres

Valider et allowlister tris et filtres.

## B08 — Transactions

Rendre atomiques les opérations multi-mutations.

## B09 — Idempotence

Garantir les opérations rejouables lorsque nécessaire.

## B10 — N+1

Éviter les requêtes redondantes en boucle.

## B11 — Timeouts

Borner les appels réseau.

## B12 — Retries

Limiter tentatives avec backoff sur opérations sûres.

## B13 — Versionnement

Protéger les consommateurs contre les breaking changes.

## B14 — OpenAPI

Maintenir la documentation API existante.

## B15 — Sorties

Retourner uniquement les champs prévus par le contrat.

## B16 — Dates

Utiliser une convention de timezone et sérialisation cohérente.

## B17 — Entités

Ne pas exposer directement champs internes ou sensibles.

## B18 — Travaux longs

Externaliser les traitements lourds si justifié.

## B19 — Diagnostic

Journaliser des informations utiles sans données sensibles.

## B20 — Erreurs privées

Ne pas divulguer l'implémentation interne aux clients.

## B21 — Tests de contrat réels dans les deux outils

Pour toute API HTTP nouvelle ou modifiée, maintenir **les deux collections importables et exécutables** selon [AT01–AT32](17-api-testing.md) : `testing/postman` et `testing/bruno`, environnement initial unique `<nomProjet>_local`, cas nominaux et erreurs conformes au contrat.
