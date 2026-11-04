# Plan de migration

| Vérification | Décision attendue |
| --- | --- |
| Schéma actuel | Version DB et migration en vigueur |
| Compatibilité | Ancien/nouveau code et ordre de déploiement |
| Risques | Volume, index, verrous et interruptions |
| Backups | Sauvegarde et restauration vérifiées |
| Retour | Migration inverse possible ou restauration |
| Validation | Tests SQL, intégrité et consommateurs |

## Approche expand / contract

1. Ajouter des colonnes ou tables compatibles.
2. Déployer du code supportant ancien et nouveau schéma.
3. Migrer progressivement les données, avec reprise idempotente.
4. Vérifier les consommateurs avant de retirer l'ancien schéma lors d'une release distincte.

Ne pas inventer une procédure de rollback lorsque les données ont été transformées de manière irréversible.
