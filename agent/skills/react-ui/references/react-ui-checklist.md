# React UI : critères visuels et fonctionnels

## Structure

- [ ] Composants existants et tokens réutilisés.
- [ ] Hooks correctement appelés, pas d'API dépréciée introduite sans vérification.
- [ ] Data fetching, erreurs, chargement, état vide et navigation intacts.
- [ ] Composants custom accessibles (clavier, label, focus).

## Fidélité

- [ ] Hauteurs navbar, recherche, cartes et contrôles cohérentes.
- [ ] Paddings gauche/droite et haut/bas équilibrés.
- [ ] Bordures, radius et couleurs sémantiques respectés.
- [ ] Light/Dark/System si disponibles, breakpoints utiles.
- [ ] Comparaison avant/après documentée **uniquement si réalisée**.

## Validations

Déterminer les scripts réellement disponibles dans `package.json` (npm/pnpm selon lockfile), puis exécuter lint/typecheck/test/build/E2E applicables. Pour interactions visuelles, exécuter Playwright ou autre runner seulement s'il est installé.

