# database

> Référentiel canonique. Les identifiants sont stables. Appliquer chaque règle lorsqu'elle est pertinente, sauf si une consigne explicite autorisée prévaut.

## DB01 — Migrations

Versionner tout changement de schéma.

## DB02 — Backups

Prévoir sauvegarde et restauration avant action risquée.

## DB03 — Données

Aucune suppression implicite de colonnes ou données.

## DB04 — Compatibilité

Planifier schema/code/data pour évolutions progressives.

## DB05 — Contraintes

Définir FK, unicité, nullabilité adaptées.

## DB06 — Index

Créer les index à partir des requêtes et volumes observés.

## DB07 — Transactions

Garantir intégrité et gestion des conflits.

## DB08 — Paramètres

Employer des requêtes préparées.

## DB09 — Fixtures

Isoler les données de test des données réelles.

## DB10 — Tests migration

Tester sur environnement non productif représentatif.

## DB11 — Coût des requêtes

Observer EXPLAIN et cardinalités.

## DB12 — Modélisation

Éviter la redondance non justifiée.

## DB13 — Seeds

Maintenir des initialisations reproductibles.

## DB14 — Soft-delete

Respecter filtres, propriété et relations.

## DB15 — Pas de reset

Ne jamais réinitialiser une base réelle pour résoudre un bug.

## DB16 — Retour arrière

Préparer rollback ou stratégie forward-only documentée.
