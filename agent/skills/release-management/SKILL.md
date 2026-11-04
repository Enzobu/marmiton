---
name: release-management
description: Prépare les versions SemVer, promotions, hotfix, notes de version et rollback sans déployer sans autorisation.
---

# release-management

## Quand l'utiliser

Demande de version, tag, promotion entre branches, changelog, hotfix, rollback ou publication.

## Règles à lire

- `rules/21-release.md`
- `rules/02-git.md`
- `rules/03-github.md`
- `rules/19-cd.md`

## Inspection initiale

1. Identifier la branche production, stratégie SemVer, tags existants, version précédente et politique locale.
2. Vérifier les changements réellement intégrés, migrations et compatibilité de données.
3. Vérifier les jobs CI et le mécanisme de preuve du commit en production.

## Procédure

1. Établir le périmètre de release depuis les commits et PR mergées, avec les breaking changes authentiques.
2. Proposer le type SemVer adapté et les notes de version, puis demander une décision avant de créer un tag.
3. Promouvoir par PR vers la branche cible et valider toutes les suites applicables; aucune promotion implicite.
4. Pour un hotfix, partir de la base correspondant à la production et répercuter le correctif sur les branches actives après accord.
5. Préparer les migrations compatibles, le plan de sauvegarde et rollback avant la release.
6. Créer tag ou déclencher une CD uniquement sur demande spécifique, puis confirmer le déploiement réel, sa santé et son SHA.

## Critères de validation

- Le tag pointe vers le commit annoncé et n'a pas été déplacé arbitrairement.
- Les notes de version ne mentionnent que des changements réellement présents.
- Le rollback traite explicitement les évolutions de schéma et la restauration de données.

## Garde-fous

Aucune release ni déploiement automatique déduit d'une PR mergée. Pas de re-tag, force push ou rollback destructeur sans accord.

## Référence détaillée

Consulter [la procédure et la checklist](references/release-checklist.md).
