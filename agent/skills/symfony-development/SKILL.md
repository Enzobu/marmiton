---
name: symfony-development
description: Intervient sur une application Symfony avec services, Doctrine, sécurité, Twig/Stimulus et batterie de tests PHP.
---

# symfony-development

## Quand l'utiliser

Feature, correction, refactor ou tests sur un projet Symfony/PHP.

## Règles à lire

- `rules/08-backend.md`
- `rules/09-database.md`
- `rules/16-stacks.md`
- `rules/17-api-testing.md`

## Inspection initiale

1. Vérifier versions PHP/Symfony, gestion Composer, conventions du projet, bundles, Doctrine et structure de services.
2. Identifier routes, Voters/roles, templates Twig, Stimulus/Turbo/Importmap, schémas DB et tests déjà présents.
3. Vérifier si l'API HTTP impose mise à jour Postman **et** Bruno.

## Procédure

1. Reproduire le comportement et identifier tous ses consommateurs avant de modifier les contrôleurs/services.
2. Garder contrôleurs légers et logique métier dans les services; valider les entrées par formulaires/Validator/DTO existants.
3. Vérifier rôle, Voter, ownership, CSRF si pertinent; ne pas exposer de champs internes.
4. Optimiser les requêtes Doctrine, les transactions et les migrations; éviter N+1, suppressions destructrices et modifications de DB hors demande.
5. Si l'UI est modifiée, réutiliser Twig, Bootstrap, Stimulus, Turbo et Importmap réellement installés, en appliquant `ui-design` si nécessaire.
6. Exécuter les suites PHPunit, PHPStan/Psalm, style, lint Symfony et build assets **existants**, puis Postman/Bruno si API HTTP touchée.

## Critères de validation

- Aucune route publique ou sécurité n'est dégradée; les droits sont vérifiés.
- Tests et analyse statique disponibles passés; tests API des deux outils synchronisés.
- Migrations vérifiées sur environnement non productif et compatibilité documentée.

## Garde-fous

Ne pas introduire Webpack/Vite ou une dépendance frontend simplement pour une correction Twig. Ne pas appliquer une migration en production sans autorisation.

## Référence détaillée

Consulter [la procédure et la checklist](references/symfony-checklist.md).
