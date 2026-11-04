# Plan de mesure des performances

## Baseline

- Objectif : métrique, percentile, seuil, population, durée.
- Environnement : CPU/RAM, version, DB, données, cache et concurrence.
- Référence : valeur moyenne/médiane/p95, dispersion, captures de profil.
- Hypothèse : cause identifiée et modification ciblée.

## Instruments

| Système | Exemples d'outils à vérifier |
| --- | --- |
| Symfony/PHP | Symfony Profiler, traces, slow query logs |
| NestJS/Node | profiling CPU, heap snapshots, OpenTelemetry existant |
| MariaDB | EXPLAIN, performance schema, N+1 |
| React/Vite | React Profiler, DevTools Performance, analyse bundle |
| Docker | docker stats, métriques Prometheus/Grafana |

## Comparaison

Même dataset, charge, warmup et protocole ; comparer plusieurs runs. Rapporter gains **et** changements éventuels de mémoire, I/O, complexité et sécurité. Ne pas annoncer un pourcentage d'amélioration si les échantillons ne sont pas comparables.
