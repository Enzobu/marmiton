# Intégration JSON des recettes — schemaVersion 1

Le mode développeur s'active dans `/profile` avec le compte de démonstration. Il ajoute « Intégration JSON » dans `/recipes/new` et `/recipes/:id/edit`.

## Contrat

Exemple complet :

```json
{
  "schemaVersion": 1,
  "title": "Lasagnes maison",
  "description": "Une recette généreuse à partager.",
  "category": "Plats",
  "difficulty": "Facile",
  "servings": 4,
  "times": { "preparation": 30, "cooking": 45, "rest": 0 },
  "budget": "Moyen",
  "ingredients": [
    { "name": "Viande hachée", "quantity": 500, "unit": "g" },
    { "name": "Sauce tomate", "quantity": 600, "unit": "g" }
  ],
  "utensils": ["Plat à gratin", "Four"],
  "steps": ["Préparer la sauce.", "Assembler les couches.", "Enfourner."],
  "imageUrl": null
}
```

- `schemaVersion` doit être égal à 1.
- `category` : `Entrées`, `Plats`, `Desserts`, `Petit-déjeuner`.
- `difficulty` : `Facile`, `Moyen`.
- `budget` : `Bon marché`, `Moyen`, `Assez cher`.
- `servings` : nombre entier de 1 à 12.
- `times` : minutes entières entre 0 et 1440 par champ.
- `ingredients` : de 1 à 60 objets avec `name`, `quantity` (nombre positif ou nul), `unit` (chaîne, vide autorisée pour les pièces).
- `utensils` : au plus 20 chaînes non vides, `steps` : de 1 à 60 chaînes non vides.
- `imageUrl` : URL absolue HTTP(S) ou `null`. Les fichiers photo locaux ne sont pas exportés.
- Aucun identifiant, UUID, auteur ou donnée de compte dans le format d'import : l'application crée son ID après validation et enregistrement.
- Les quantités importées correspondent à `servings` ; la fiche utilise la même base pour calculer les autres portions.

Le parseur refuse les versions non prises en charge, les champs inconnus et les valeurs hors limites ; une entrée invalide ne change pas le formulaire.

## Fonctionnement

- L'import valide le JSON, demande confirmation, puis **remplit seulement le formulaire**.
- « Charger l'exemple » insère le document ci-dessus ; lorsqu'il reste intact, le bouton se change en « Copier l'exemple ». Toute modification remet « Charger l'exemple ».
- L'export reflète le formulaire. « Copier » utilise le presse-papiers et « Télécharger » crée un fichier `.json` nommé à partir du titre normalisé (minuscules, sans accents, underscores).
- Le mode développeur est une **préférence UI**, sauvegardée localement, pas un contrôle d'accès.
- Démonstration frontend seulement : aucun envoi serveur, aucune importation persistante après rechargement.

L'API devra répéter la validation et vérifier les droits du propriétaire avant toute création ou édition.
