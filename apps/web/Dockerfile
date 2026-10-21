# syntax=docker/dockerfile:1
# Contexte de build : racine du monorepo (docker compose s'en charge)

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN npm ci -w @techshop/shared -w @techshop/web --include-workspace-root=false
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @techshop/shared && npm run build -w @techshop/web

# Fichiers statiques servis par nginx, qui relaie aussi /api vers l'API
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
