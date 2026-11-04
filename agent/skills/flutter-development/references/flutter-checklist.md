# Flutter : checklist

## Code

- [ ] Null safety, analyse statique et format.
- [ ] Widgets et state management existants.
- [ ] Controllers, streams, timers nettoyés.
- [ ] Navigation et restauration de l'état.
- [ ] Thème clair/sombre/système et accessibilité.

## Plateformes

- [ ] Android/iOS réellement pris en charge.
- [ ] Permissions et notifications testées sur la version d'OS pertinente.
- [ ] Fonctionnement background vérifié, pas déduit d'une réussite en foreground.
- [ ] Build Android ou iOS réellement produit si demandé et possible.

## Commandes typiques

`dart format --output=none --set-exit-if-changed .`
`flutter analyze`
`flutter test`
`flutter build apk` (uniquement si demandé et environnement configuré)

Les commandes sont illustratives : vérifier la configuration du dépôt et les plateformes visées.

