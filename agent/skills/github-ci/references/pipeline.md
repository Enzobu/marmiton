# Conception d'une CI GitHub Actions

## Matrice selon la stack

| Stack | Vérifications applicables |
| --- | --- |
| Symfony | Composer validation, PHPUnit, analyse statique, format/lint Symfony |
| NestJS | Lint, TypeScript, tests unitaires/intégration/E2E, build |
| React/Vite | Lint, typecheck, tests, build, E2E si présents |
| Flutter | Format Dart, analyze, flutter test, build si disponible |
| Docker | Dockerfile lint, vérification Compose, scan selon outils configurés |
| API HTTP | **Postman et Bruno**, authentification et assertions réelles |

Ne pas inventer des scripts inexistants : lire les manifestes et les adapter.

## Gate final

`ci-required` dépend de **tous** les jobs obligatoires et valide leur résultat réel, même quand un job préalable est skipped ou cancelled. Mettre à jour la liste `needs` lors de l'ajout d'un contrôle.

## Sécurité

`permissions: contents: read` comme base lorsque suffisant, secrets par scopes, actions épinglées à des SHA validés et aucune publication de valeurs sensibles.

## Vérification

Valider la syntaxe, puis vérifier une exécution GitHub Actions. Une validation YAML locale n'est pas une preuve que tous les jobs ont tourné.

