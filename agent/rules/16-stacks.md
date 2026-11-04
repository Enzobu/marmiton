# Règles techniques par stack

Ces conventions sont **conditionnelles** : ne lire et appliquer que les sections des technologies réellement présentes. Les conventions déjà validées du projet prévalent sur les préférences générales compatibles.

## PHP / Symfony

1. Respecter PSR-12 si aucune convention de code différente n'existe; utiliser les types de PHP selon compatibilité du projet.
2. Conserver contrôleurs fins, logique métier dans services, injection de dépendances et validation via mécanismes Symfony.
3. Sécuriser accès avec rôles, Voters et contrôles de propriété; utiliser les protections CSRF pertinentes.
4. Utiliser Doctrine avec requêtes paramétrées, transactions et attention aux N+1.
5. Versionner et tester les migrations Doctrine hors production avant intégration.
6. Respecter Twig, Bootstrap, Stimulus, Turbo, Importmap et les outils réellement présents sans introduire une nouvelle chaîne frontend gratuitement.
7. Lancer les vérifications disponibles : PHPUnit, PHPStan ou Psalm, PHP-CS-Fixer ou PHPCS, Symfony lint et compilation des assets si applicable.

## NestJS / TypeScript / Prisma

1. Respecter le tsconfig strict et la séparation controllers/services/modules/guards.
2. Utiliser DTO et validation runtime avec ValidationPipe ou mécanisme déjà installé.
3. Centraliser exceptions et autorisations; contrôler ownership/tenant des ressources.
4. Éviter any et les assertions non nulles injustifiées; privilégier interfaces et types stables.
5. Pour Prisma, versionner schéma/migrations, utiliser transactions et éviter accès N+1.
6. Préserver contrats OpenAPI et clients consommateurs.
7. Exécuter tous les scripts configurés de tests unitaires, intégration/E2E, eslint, format, typecheck et build.

## React / Vite

1. Respecter Rules of Hooks; utiliser composants fonctionnels et keys stables.
2. Limiter les effets aux synchronisations externes; dériver le state quand possible et nettoyer listeners/abonnements.
3. Conserver routing, design system, thèmes et gestion de state déjà choisis.
4. Prévoir loading, empty, error, focus clavier, responsive et formulaires accessibles.
5. Éviter d'ajouter un state manager ou une lib UI sans nécessité.
6. Lancer tests, lint, typecheck, build Vite et E2E existants.

## Flutter / Dart

1. Appliquer null safety, analyse statique et format Dart.
2. Respecter les patterns de state management et navigation existants.
3. Ne pas mettre d'effets de bord dans build; gérer dispose de streams, listeners et controllers.
4. Respecter thèmes Light/Dark/System et préférences d'accessibilité lorsque configurés.
5. Tester les permissions et notifications propres aux plateformes mobiles touchées.
6. Lancer dart format --output=none --set-exit-if-changed ., flutter analyze, flutter test, builds et tests d'intégration disponibles.

## MariaDB / SQL

1. Respecter charset/collation (utf8mb4 par défaut si aucune autre convention), nommage et types existants.
2. Définir contraintes d'intégrité, FK et unicité pertinentes.
3. Paramétrer les requêtes; utiliser transactions pour mutations atomiques.
4. Étudier EXPLAIN avant création d'index et éviter la redondance inutile.
5. Tester toutes les migrations sur base non productive avec stratégie de sauvegarde/retour.

## Docker / Compose

Respecter [les règles Docker](10-docker.md) : aucun attribut `version` dans Compose et `restart: unless-stopped` par défaut. Ne pas reconfigurer Traefik, Dokploy ou un reverse-proxy sans nécessité et autorisation.

## Tests API Postman + Bruno (Symfony, NestJS et autres API HTTP)

Lorsqu'une stack de ce document expose une API HTTP, appliquer systématiquement [AT01–AT32](17-api-testing.md). Cela concerne notamment les routes Symfony et les contrôleurs NestJS : **une collection Postman et une collection Bruno**, chacune couvrant les routes, méthodes, succès, validation, auth, permissions, 404, conflits et erreurs métier pertinents. Chaque outil reçoit **un seul environnement initial `<nomProjet>_local`**. Les suites sont exécutées localement avec la batterie complète des tests disponibles. Aucun nouveau pipeline CI/CD.

## Docker, volumes et fichiers env

Pour toute stack conteneurisée, appliquer [les règles ENV](20-environment.md) et [les règles Docker](10-docker.md). Sous Dokploy, utiliser des bind mounts pour toutes les données persistantes sous `/etc/dokploy_volume/<APP>/<donnée>` par défaut; déclarer chaque chemin hôte dans `.env.example`. Aucun volume Docker géré, nommé ou anonyme, même temporaire.
