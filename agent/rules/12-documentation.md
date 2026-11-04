# documentation

> Référentiel canonique. Les identifiants sont stables. Appliquer chaque règle lorsqu'elle est pertinente, sauf si une consigne explicite autorisée prévaut.

## M01 — README

Tenir à jour procédures et prérequis.

## M02 — Proportion

Documenter l'essentiel actionnable sans duplication.

## M03 — Installation

Décrire comment lancer le projet.

## M04 — .env.example exhaustif

Créer et maintenir `.env.example` pour tout projet utilisant des variables d'environnement. Décrire les variables obligatoires et optionnelles, les valeurs d'exemple non sensibles et **chaque chemin hôte de bind mount persistant**. Ne jamais y inclure de secret réel. Appliquer [les règles ENV](20-environment.md).

## M05 — Contrats

Synchroniser la documentation API.

## M06 — Architecture

Consigner décisions structurantes si le projet le prévoit.

## M07 — Commentaires

Documenter le pourquoi, pas l'évidence.

## M08 — Commandes

Ne jamais annoncer une commande non exécutée comme testée.

## M09 — Ruptures

Documenter migration et impact des breaking changes.

## M10 — Langue

Respecter la langue conventionnelle du dépôt.

## M11 — Localité

Placer docs près des modules concernés si pertinent.

## M12 — Source canonique

Éviter plusieurs documents contradictoires.
