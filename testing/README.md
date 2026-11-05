# Tests HTTP

API locale : `http://localhost:3001`.

- Postman : importer `postman/marmiton.postman_collection.json` et le seul environnement `postman/marmiton_local.postman_environment.json`, puis lancer toute la collection.
- Bruno : ouvrir `bruno/`, sélectionner l'unique environnement `marmiton_local`, puis exécuter la collection avec Bruno CLI (`bru run --env marmiton_local`) ou l'interface.

Cas couverts : santé 200 et route inconnue 404. Aucun token ni donnée réelle.
