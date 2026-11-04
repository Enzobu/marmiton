---
name: nestjs-development
description: Développe des services NestJS TypeScript avec DTO, auth/guards, Prisma, contrats API et tests complets.
---

# nestjs-development

## Quand l'utiliser

Modification d'un backend NestJS, de ses contrôleurs, services, guards ou schéma Prisma.

## Règles à lire

- `rules/08-backend.md`
- `rules/09-database.md`
- `rules/16-stacks.md`
- `rules/17-api-testing.md`
- `rules/23-monorepo.md`

## Inspection initiale

1. Examiner workspace/lockfile, versions NestJS/Prisma, modules, configuration TypeScript, pipelines et DTO.
2. Lister endpoints, guards, contrats OpenAPI et utilisateurs ou tenants impactés.
3. Identifier migrations Prisma et consommateurs frontend ou IoT.

## Procédure

1. Implémenter la logique dans services et modules existants; garder controllers fins.
2. Utiliser DTO, ValidationPipe et erreurs cohérentes; pas de types `any` ajoutés pour contourner le compilateur.
3. Préserver guards, authn/authz, ownership, séparation de tenant et validation de l'utilisateur authentifié.
4. En cas de schéma Prisma : migration versionnée, compatibilité ascendante, transaction et plan de retour.
5. Mettre à jour les contrats OpenAPI, les clients partagés et les collections Postman + Bruno avec Bearer automatique si besoin.
6. Exécuter scripts unitaires/E2E, lint, typecheck, build et validations DB **du package ciblé et des consommateurs affectés**.

## Critères de validation

- Contrats, statuts HTTP et champs sensibles conformes; garde-fous auth testés.
- Prisma Client généré si nécessaire sans modifier les migrations historiques.
- Tests des deux outils exécutés ou impossibilité précisément documentée.

## Garde-fous

Ne jamais lancer `prisma db push` sur production pour contourner une migration; ne pas utiliser `--force` pour réparer un état inconnu.

## Référence détaillée

Consulter [la procédure et la checklist](references/nestjs-checklist.md).
