# conditional

> Référentiel canonique. Les identifiants sont stables. Appliquer chaque règle lorsqu'elle est pertinente, sauf si une consigne explicite autorisée prévaut.

## X01 — Bug: cause

Reproduire et isoler la cause avant correction.

## X02 — Bug: test

Ajouter non-régression et protéger comportements voisins.

## X03 — Feature: architecture

Lire structure et contrats existants.

## X04 — Feature: critères

Vérifier tous les critères d'acceptation.

## X05 — Refactor: équivalence

Conserver comportement observable sauf exception voulue.

## X06 — Refactor: isolation

Ne pas introduire de fonctionnalités au passage.

## X07 — UI: interactions

Préserver les actions et routes existantes.

## X08 — UI: propagation

Vérifier chaque usage partagé touché.

## X09 — Migration: impact

Identifier clients, schéma et incompatibilités.

## X10 — Migration: retour

Prévoir stratégie de rollback ou reprise.

## X11 — Hotfix: minimal

Limiter la modification au correctif urgent.

## X12 — Hotfix: branche

Suivre la base hotfix du dépôt.

## X13 — Suppression: usages

Rechercher tous les consommateurs et références.

## X14 — API: compatibilité

Vérifier les clients de chaque contrat modifié.

## X15 — DB: protection

Sauvegarde et accord avant toute destruction.

## X16 — Configuration: portée

Vérifier impacts entre environnements; pas de production implicite.

## X17 — Dépendances: migration

Lire breaking changes et valider intégralement.

## X18 — Sécurité: abus

Tester permissions et cas adverses.

## X19 — Performance: preuves

Mesurer et valider régressions.

## X20 — Déploiement demandé: santé

Si un déploiement est explicitement demandé, vérifier la santé après opération; aucune politique CI/CD définie ici.
