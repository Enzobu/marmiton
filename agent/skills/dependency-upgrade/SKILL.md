---
name: dependency-upgrade
description: Planifie des mises à jour de dépendances avec analyse des breaking changes, migrations et tests adaptés à la stack.
---

# dependency-upgrade

## Quand utiliser ce Skill

Lorsqu'une intervention demande une analyse ciblée selon la description, et non systématiquement pour chaque modification.

## Rules canoniques

- `rules/14-packages.md`
- `rules/04-quality.md`
- `rules/05-testing.md`
- `rules/06-security.md`

## Procédure opérationnelle

1. Inventorier dépendances directes, lockfile, runtime, versions et outils de build existants; constater la version courante et cibler uniquement les packages demandés.
2. Vérifier les versions effectivement disponibles, les avis de sécurité et les notes de migration officielles avant de décider d'une mise à niveau majeure.
3. Établir une matrice risque/compatibilité avec transitive dependencies, Node/PHP/Dart et clients API; séparer correctifs urgents et migrations majeures.
4. Modifier manifests et lockfile de manière cohérente avec le package manager du projet; ne pas mélanger npm, pnpm, Composer ou pub.
5. Adapter code/API, migrations, types et tests affectés; ne jamais forcer une résolution `--legacy-peer-deps` ou `--force` pour masquer des conflits.
6. Lancer les tests existants (lint, format, analyse, unitaires, intégration, E2E, build) et comparer les régressions, puis ouvrir une PR selon la politique locale.
7. Documenter versions avant/après, breaking changes, CVE confirmées, tests effectivement exécutés, limitations et rollback.

## Critères de validation

- Aucun changement de dépendance hors périmètre sans justification.
- Aucune vulnérabilité inventée : avis officiels et versions vérifiés.
- Le lockfile et le code sont alignés; rien n'est déclaré compatible sans essais.

## Limites de sécurité

Ne jamais mettre à jour aveuglément toutes les versions, exécuter un install script inconnu avec privilèges, ou merger/déployer sans accord.

## Guide de vérification

Lire [la référence](references/upgrade-checklist.md) pour la matrice de preuves et le rapport.
