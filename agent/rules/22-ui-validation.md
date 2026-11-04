# ui validation

> Règles conditionnelles : appliquer uniquement aux projets et interventions concernés.

## UV01 — Référence visuelle

Pour une modification UI, étudier le composant actuel, ses usages et la maquette/fichier image fourni avant de coder.

## UV02 — Densité et proportions

Conserver la cohérence des paddings, hauteurs, bordures, rayons, gaps, taille des cartes et barres de navigation; éviter les composants surdimensionnés sans demande.

## UV03 — États interactifs

Vérifier hover, focus, disabled, loading, erreur, vide, sélection et succès pour tous les contrôles touchés.

## UV04 — Thèmes

Contrôler le rendu clair, sombre et système s'ils existent, y compris les couleurs sémantiques comme succès, erreur et avertissement.

## UV05 — Responsive

Tester les points de rupture pertinents, textes longs, zoom, débordements et interactions clavier/tactiles.

## UV06 — Composants partagés

Identifier et vérifier chaque page réutilisant un composant ou des styles modifiés; éviter de réparer une page en dégradant les autres.

## UV07 — Composants custom

Si le projet utilise ses propres selects/radios/switches, suivre le design system tout en conservant libellés, focus et accessibilité natifs.

## UV08 — Captures comparatives

Lorsque le navigateur ou des snapshots sont disponibles, comparer le rendu avant/après; décrire précisément les différences restantes et ne pas inventer une vérification visuelle.

## UV09 — Tests visuels

Ajouter des tests de composants ou snapshots visuels reproductibles pour les régressions récurrentes lorsque l'infrastructure existe; ne pas figer des snapshots sans revue.

## UV10 — Critère de livraison

Une refonte UI n'est terminée que si les interactions fonctionnent, les pages impactées sont cohérentes et les contrôles applicables sont exécutés.
