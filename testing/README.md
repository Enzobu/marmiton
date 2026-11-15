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
