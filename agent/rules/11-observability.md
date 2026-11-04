# observability

> Référentiel canonique. Les identifiants sont stables. Appliquer chaque règle lorsqu'elle est pertinente, sauf si une consigne explicite autorisée prévaut.

## O01 — Structure

Employer logs structurés selon la stack.

## O02 — Niveaux

Utiliser debug, info, warn, error de façon cohérente.

## O03 — Confidentialité

Exclure secrets et données privées des logs.

## O04 — Contexte

Ajouter identifiants et contexte diagnostique utiles.

## O05 — Bruit

Limiter logs répétitifs et volumineux.

## O06 — Corrélation

Propager request-id / trace-id si disponible.

## O07 — Métriques

Instrumenter erreurs, latences et saturation pertinentes.

## O08 — Santé

Distinguer disponibilité réelle et simple processus vivant.

## O09 — Échecs

Ne pas masquer les erreurs récupérables.

## O10 — Diagnostic

Observer logs et métriques avant correction.
