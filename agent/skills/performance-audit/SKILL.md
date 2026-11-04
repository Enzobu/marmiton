---
name: performance-audit
description: Mesure latence, charge, mémoire et rendus UI avant toute optimisation, avec preuves et non-régression.
---

# performance-audit

## Quand utiliser ce Skill

Lorsqu'une intervention demande une analyse ciblée selon la description, et non systématiquement pour chaque modification.

## Rules canoniques

- `rules/13-performance.md`
- `rules/11-observability.md`
- `rules/05-testing.md`
- `rules/22-ui-validation.md`

## Procédure opérationnelle

1. Définir un objectif mesurable (p95, TTFB, LCP, CPU, mémoire, requêtes DB) et un environnement reproductible.
2. Collecter un baseline avec trafic/fixtures comparables et les outils réellement disponibles (profiler, traces, EXPLAIN, browser performance).
3. Identifier le goulet dominant en distinguant réseau, serveur, accès base, N+1, sérialisation, bundle frontend et rendu React.
4. Établir une hypothèse testable, modifier un élément à la fois, conserver les métriques avant/après et éviter l'optimisation prématurée.
5. Pour DB, lire EXPLAIN et contraintes; pour React, profiler les re-renders et poids bundle; pour backend, temps de requêtes et allocations.
6. Vérifier l'équivalence fonctionnelle, la sécurité, les budgets et les tests existants; mesurer plusieurs fois lorsque la variance est importante.
7. Produire résultats avec configuration de test, traces/métriques, limites et compromis; signaler l'absence d'outil ou de baseline.

## Critères de validation

- Mesures chiffrées avant/après sur environnement comparable.
- Aucune fonctionnalité dégradée ni test désactivé pour obtenir de meilleures métriques.
- Les optimisations non mesurées ne sont pas présentées comme des gains confirmés.

## Limites de sécurité

Pas de benchmark agressif ou test de charge sur production sans accord, ni modification de configuration d'observabilité/DB en production implicite.

## Guide de vérification

Lire [la référence](references/measurement-plan.md) pour la matrice de preuves et le rapport.
