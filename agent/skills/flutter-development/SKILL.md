---
name: flutter-development
description: Développe des applications Flutter/Dart avec thèmes, notifications, navigation, permissions et tests mobiles.
---

# flutter-development

## Quand l'utiliser

Feature, correction, design ou build d'une application Flutter Android/iOS.

## Règles à lire

- `rules/16-stacks.md`
- `rules/05-testing.md`
- `rules/07-frontend.md`
- `rules/22-ui-validation.md`

## Inspection initiale

1. Identifier versions Flutter/Dart, plateformes réellement ciblées, navigation, state management, plugins et notifications.
2. Vérifier préférences Light/Dark/System, stockage, permissions Android/iOS, cycle de vie et CI existante.
3. Lire les tests et éventuels rapports de crash réels.

## Procédure

1. Respecter null safety et state management existant; éviter effets de bord dans `build()`.
2. Traiter les notifications, permissions, background/isolate et cycle de vie selon les plateformes **et versions** ciblées; ne pas présumer leur fonctionnement sur écran verrouillé.
3. Préserver dispose pour controllers/streams/listeners et comportements de reprise de l'application.
4. Réutiliser thèmes, couleurs primaires, navigation et widgets partagés; vérifier accessibilité, densité et petits écrans.
5. Ajouter les tests pertinents (widgets, unitaires, intégration) sans masquer les limites d'un simulateur.
6. Exécuter Dart format, Flutter analyze, flutter test et builds disponibles, en distinguant Android/iOS et la configuration réelle.

## Critères de validation

- Navigation et persistance ne régressent pas.
- Permissions/notifications ont été vérifiées sur cible pertinente ou clairement marquées non testées.
- Aucun build APK/IPA n'est annoncé sans sortie réelle.

## Garde-fous

Ne pas changer des permissions, signer une version release, publier sur un store ni déclencher EAS/Firebase sans demande.

## Référence détaillée

Consulter [la procédure et la checklist](references/flutter-checklist.md).
