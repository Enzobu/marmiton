---
name: react-ui
description: Implémente et refond des interfaces React/Vite cohérentes, accessibles et testées visuellement.
---

# react-ui

## Quand l'utiliser

Création, correction ou refonte de composants React, styles, navigation, thèmes ou expérience utilisateur.

## Règles à lire

- `rules/07-frontend.md`
- `rules/22-ui-validation.md`
- `rules/16-stacks.md`
- `rules/05-testing.md`

## Inspection initiale

1. Identifier Vite/React, routing, état, bibliothèque UI, styles, thème et outils tests existants.
2. Lister tous les usages du composant, les références fournies et les données métier réellement attendues.
3. Vérifier présence d'une maquette/capture accessible pour invocation de `ui-design`.

## Procédure

1. Définir ou lire les tokens de design, grille, densité, hauteur et hiérarchie de la référence.
2. Préserver Rules of Hooks, keys stables, architecture des composants et interactions fonctionnelles.
3. Utiliser état dérivé quand possible, limiter les effects aux synchronisations externes et nettoyer listeners.
4. Construire des formulaires accessibles avec labels, focus, validation, loading/empty/error.
5. Vérifier desktop/mobile et thèmes configurés, en particulier padding, navbar, selects, radios/switches et composants partagés.
6. Si rendu/browser disponible, comparer captures avant/après et corriger les écarts; exécuter lint, tests, typecheck, build et E2E disponibles.

## Critères de validation

- Tous les usages d'un composant partagé restent cohérents.
- Navigation, focus, clavier, responsive et états fonctionnent réellement.
- Ne pas déclarer une comparaison de captures sans l'avoir réalisée.

## Garde-fous

Ne pas ajouter un UI kit ou state manager complet pour une retouche, supprimer des fonctionnalités ou copier des actifs propriétaires d'une référence.

## Référence détaillée

Consulter [la procédure et la checklist](references/react-ui-checklist.md).
