---
name: ui-design
description: Conçoit ou refond une interface depuis une maquette, capture ou référence, avec design system, intégration et validation visuelle.
---

# UI Design

**Déclencher** lors d'une création de maquette UI, reproduction d'une référence, refonte visuelle ou correction d'incohérences de design.

Lire `rules/07-frontend.md`, `rules/22-ui-validation.md`, `rules/04-quality.md`, la stack concernée dans `rules/16-stacks.md`, et [la grille d'analyse](references/visual-analysis.md).

## Deux modes

- **Création à partir d'une référence** : image, URL accessible, maquette ou description.
- **Refonte de l'existant** : l'UI du dépôt est la base; l'agent conserve les fonctions et l'identité demandées.

## Procédure

1. Inspecter la référence **réellement accessible** et l'existant : densité, proportions, alignements, paddings, radii, couleurs, typographie, tailles navbar/search/cartes, interactions, thème et responsive. Ne jamais prétendre avoir vu une référence inaccessible.
2. Repérer composants réutilisables, design tokens, outils et pages communes.
3. Rédiger un bref [design brief](assets/design-brief.md) : référence, objectifs, contraintes, tokens, écrans impactés et critères d'acceptation. Adapter sa longueur à la tâche.
4. Implémenter avec composants et tokens partagés; garder navigation clavier, contrôles accessibles, focus visible et interactions. Ne jamais supprimer une fonctionnalité pour suivre une capture.
5. Vérifier les thèmes existants, les breakpoints pertinents, les états loading/empty/error/disabled/hover/focus et les autres pages utilisant les composants modifiés.
6. Si navigateur et captures sont disponibles, comparer **avant/après**, lister 3 à 6 écarts mesurables, les corriger et revérifier. Sinon indiquer explicitement que la validation visuelle n'a pas été exécutée.
7. Lancer les tests, lint, typecheck et build applicables. Décrire les écarts restants sans déclarer un résultat non testé.

## Principes

- Ne pas produire systématiquement de cartes et barres énormes : suivre la **densité** de la référence, et non une préférence arbitraire.
- Une capture ne révèle pas des pixels CSS exacts : indiquer les estimations jusqu'à leur validation.
- Une inspiration (ex. une autre application) ne signifie pas copier logos ni contenus propriétaires.
- Les corrections doivent se faire à la source des composants, sans dégrader les autres pages.

## Livrables

Diff du code, tokens utilisés, composants touchés, preuves de rendu lorsqu'elles existent, tests réellement exécutés et limitations.
