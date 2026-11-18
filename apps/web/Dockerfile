# Use glibc for the native Rollup parser when bundling React.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install --no-audit --no-fund
COPY apps/web apps/web
COPY apps/api/src/recipe-json.ts apps/api/src/ingredient-icons.ts apps/api/src/image-limits.ts apps/api/src/nutrition-types.ts apps/api/src/nutrition-weight.ts apps/api/src/
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w @marmiton/web

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
