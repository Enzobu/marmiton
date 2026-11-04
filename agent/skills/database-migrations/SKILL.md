---
name: database-migrations
description: Sécurise et teste les migrations SQL Doctrine et Prisma, avec compatibilité et restauration.
---

# database-migrations

## Déclenchement

Utiliser lors des interventions concernées, selon les contraintes du dépôt et les outils réellement disponibles.

## Règles canoniques à lire

- `rules/09-database.md`
- `rules/21-release.md`
- `rules/24-operations.md`

## Procédure

1. Déterminer moteur/version, schéma existant, application et consommateurs concernés.
2. Identifier taille, verrouillages, intégrité, contraintes, backups disponibles, retour arrière possible.
3. Proposer une migration versionnée, additive et rétrocompatible si nécessaire; séparer expand, backfill et contract sur plusieurs releases.
4. Tester sur base non productive avec données représentatives et vérifier les tests applicatifs et API.
5. Documenter impact, durée, sauvegarde, restauration, rollback et conditions d'exécution.
6. Exécuter sur production seulement après autorisation spécifique.

## Conditions de réussite

- Aucune modification destructive implicite et aucune migration historique modifiée.
- Intégrité des données, compatibilité ancien/nouveau code et restauration réaliste.
- Résultats de test attestés, pas supposés.

## Garde-fous

Les DDL MariaDB ne sont pas forcément transactionnels. Ne pas utiliser reset, force ou purge et ne pas lancer de migration prod sans consentement.

## Référence opérationnelle

Consulter [la checklist](references/migration-plan.md) avant livraison.
