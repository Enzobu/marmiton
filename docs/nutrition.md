# Nutrition des recettes

Le calcul indique les kcal, les protéines, les glucides et les lipides par portion. Il se fait à la lecture de la fiche, y compris pour les recettes existantes. Les corrections enregistrées dans l’éditeur sont propres à la recette. L’option de réutilisation enregistre aussi un alias exact pour les recettes du carnet. Le format JSON de recette v1 reste identique.

Le poids est déduit des unités de masse. Les estimations par pièce sont de 50 g pour un œuf entier, 100 g pour un oignon (150 g pour un gros), 70 g pour une carotte, 3 g pour une gousse d’ail (30 g par tête) et 10 g par cube de bouillon de bœuf. Pour l’eau et les bouillons reconstitués, l’estimation est de 1 g par ml. Les poids de la saucisse de Toulouse, de l’échine de porc et du bœuf à bourguignon sont interprétés comme crus quand le libellé ne précise pas de cuisson. Les haricots blancs cuits et égouttés sont associés aux haricots cuits à l’eau, avec une association distincte pour les conserves explicitement indiquées. L’éditeur accepte un poids comestible total pour les ingrédients dont l’unité, la densité ou la taille ne permettent pas une conversion fiable. Les valeurs absentes et les traces non chiffrées sont traitées comme inconnues. La migration complémentaire utilise 0,25 g pour 100 g pour les lipides de l’ail, de la carotte et de la pulpe de tomate lorsque Ciqual indique moins de 0,5 g. Le calcul peut rester partiel.

## Données Ciqual

Source : Du Chaffaut, Laure, Oseredczuk, Marine et Gauvreau-Béziat, Julie. **Table de composition nutritionnelle des aliments Ciqual 2025**, Anses, fichier français du 3 novembre 2025. Licence Ouverte Etalab 2.0. [Jeu de données DOI 10.57745/RDMHWY](https://doi.org/10.57745/RDMHWY).

La migration additive `202611170001_recipe_nutrition` intègre les 3 484 aliments, quatre valeurs pour 100 g et des alias de départ. Elle est appliquée par le démarrage habituel de l’API Docker. Aucune requête à l’Anses pendant l’utilisation. Le script `scripts/generate-ciqual-migration.py` reproduit la migration à partir du fichier XLSX officiel et nécessite Python avec `openpyxl`. Une nouvelle version du référentiel doit arriver par une nouvelle migration.

Les migrations MariaDB incluent des opérations DDL. Vérifier la sauvegarde avant une mise en production. En cas de retour à l’application précédente, les tables et les colonnes additives peuvent rester en place, pour conserver les corrections déjà saisies.
