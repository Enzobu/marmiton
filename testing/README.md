# Tests HTTP

API locale : `http://localhost:3001`.

- Postman : importer `postman/marmiton.postman_collection.json` et le seul environnement `postman/marmiton_local.postman_environment.json`, puis lancer toute la collection.
- Bruno : ouvrir `bruno/`, sélectionner l'unique environnement `marmiton_local`, puis exécuter la collection avec Bruno CLI (`bru run --env marmiton_local`) ou l'interface.

La collection couvre la santé, les routes inconnues, le catalogue paginé et filtré, le détail d’une recette et les entrées invalides. Elle attend une base MariaDB locale dédiée aux tests avec le jeu de données de développement.

Depuis la racine du dépôt, avec `DATABASE_URL` qui pointe vers cette base :

```sh
npm exec -w @marmiton/api -- prisma migrate deploy
npm exec -w @marmiton/api -- prisma db seed
npm run dev:api
```

Le seed réutilise huit recettes de démonstration avec des UUID fixes. Il peut être relancé sans vider la base, dupliquer les recettes ni écraser leurs modifications.

## Compte propriétaire

Après les migrations, injecter `OWNER_EMAIL`, `OWNER_FIRST_NAME`, `OWNER_LAST_NAME` et `OWNER_PASSWORD` en variables d’environnement lors du lancement de `node apps/api/dist/create-owner.js`. Compiler l’API avant cette commande. Dans Docker, exécuter la commande dans le service `api` avec ces mêmes variables. La commande laisse intact un compte déjà créé.

Pour les collections avec authentification, utiliser uniquement une base de test et le compte fictif de la CI (`owner@example.invalid`, mot de passe de fixture `Fixture-Password42`). La collection vérifie connexion, profil, révocation et échecs. La réinitialisation valide de bout en bout est couverte par les tests d’intégration avec un faux transport SMTP. Configurer `PUBLIC_WEB_URL` et les paramètres `SMTP_*` pour l’envoi réel.

Le dossier `planning` vérifie les courses, le menu et les notes. Lancez-le sur une base de test fraîche avec les recettes du seed. Les requêtes créent puis retirent leurs articles et leur repas, et effacent la note sur la première recette de démonstration. La connexion et la déconnexion du dossier gèrent le jeton du runner.
