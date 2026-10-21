# syntax=docker/dockerfile:1
# Contexte de build : racine du monorepo (docker compose s'en charge)

FROM node:22-slim AS base
# OpenSSL est requis par le moteur Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
# Le hook « prepare » (husky) ne sert qu'au poste de dev : on le retire de l'image
RUN npm pkg delete scripts.prepare \
  && npm ci -w @techshop/shared -w @techshop/api --include-workspace-root=false
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @techshop/shared && npm run build -w @techshop/api

FROM base AS runtime
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm pkg delete scripts.prepare \
  && npm ci --omit=dev -w @techshop/shared -w @techshop/api --include-workspace-root=false \
  && npm cache clean --force
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/prisma apps/api/prisma
COPY apps/api/docker-entrypoint.sh apps/api/
RUN cd apps/api && npx prisma generate \
  && mkdir -p /data && chown node:node /data
WORKDIR /app/apps/api
# Jamais root dans le conteneur
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
