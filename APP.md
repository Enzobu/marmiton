# Marmiton maison

Carnet de recettes auto-hébergé. Ce dépôt est issu du template agent-rules : les règles et skills sous `agent/` sont déjà présents et n'ont pas été modifiés.

## Stack
- npm workspaces : `apps/web` (React 19, Vite 7, TypeScript) et `apps/api` (Fastify 5, TypeScript).
- Prisma 6 (provider `mysql` compatible MariaDB), MariaDB 11.4.
- Docker Compose avec bind mounts persistants, aucun volume Docker géré.

## Développement
Prérequis : Node.js 22+, npm, MariaDB 11.

1. `npm install`
2. `cp .env.example .env`, renseigner `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `DATABASE_URL`. En local, lancer MariaDB et créer l'utilisateur ou lancer uniquement `db` avec Compose.
3. `npm run db:generate`
4. `npm run db:migrate` (après création de la base)
5. `npm run dev:api` et `npm run dev:web` dans deux terminaux. Le frontend écoute sur http://localhost:5173 et l'API sur http://localhost:3001.

Le modèle Prisma est un point de départ : aucune migration n'est créée avant la première génération locale. Les routes de recettes et l'authentification ne sont pas encore implémentées.

## Docker
Créer les dossiers hôtes de `DB_DATA_PATH` et `UPLOADS_PATH`, avec droits adaptés aux processus conteneurisés. Renseigner `.env`, puis `docker compose -f compose.yml up --build -d`. Web : http://localhost:8080. L'API est également exposée uniquement sur loopback ; nginx relaie `/api/` vers celle-ci.

Pour un hébergement via Dokploy, adapter la publication web au reverse proxy et conserver les chemins persistants sous `/etc/dokploy_volume/marmiton/`. Aucun déploiement automatique n'est fourni.

## Validation
- `npm run typecheck`
- `npm run lint` (typecheck en attendant une configuration ESLint)
- `npm run test`
- `npm run build`
- Postman et Bruno : `testing/README.md`

## Rules / Skills
Lancer `bash agent/scripts/init.sh --profile standard` pour visualiser la configuration adaptée à la nouvelle stack, puis `--write` après examen. Les Rules et Skills canoniques sont déjà dans ce dépôt.
