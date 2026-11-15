FROM node:22-alpine AS build
RUN apk add --no-cache openssl git
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --no-audit --no-fund
COPY apps/api apps/api
RUN npm run db:generate && npm run build -w @marmiton/api
RUN --mount=type=bind,source=.,target=/source \
    if [ -d /source/.git ]; then \
      git --git-dir=/source/.git rev-parse --verify HEAD > /app/build-revision; \
    else \
      printf 'unavailable\n' > /app/build-revision; \
    fi

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/build-revision ./build-revision
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
USER node
EXPOSE 3001
WORKDIR /app/apps/api
CMD ["sh", "-c", "node /app/node_modules/prisma/build/index.js migrate deploy && exec node dist/server.js"]
