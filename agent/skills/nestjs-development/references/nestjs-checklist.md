# NestJS + Prisma — revue

| Couche | Vérification |
| --- | --- |
| Controller | route/verb, DTO, statuts, OpenAPI |
| Service | business logic, transactions, erreurs |
| Guard | 401/403/ownership/tenant |
| Prisma | migrations tracées, index, compatibilité |
| Client | DTO/types partagés et consommateurs |
| Tests | unitaires, E2E, lint, typecheck, build |
| API | Postman et Bruno importables, auth Bearer auto |

## Outils indicatifs

Lire `package.json`, `pnpm-workspace.yaml` et le gestionnaire installé avant de lancer `pnpm --filter <package> test`, `pnpm --filter <package> build` ou `pnpm prisma migrate dev`. Les noms de scripts/chemins sont propres au dépôt.

Tester les migrations sur base non productive et les scénarios permissions négatives avant livraison.

