#!/bin/sh
set -e

# Synchronise le schéma puis peuple la base seulement si elle est vide
npx prisma db push --skip-generate
node dist/db/seed.js --if-empty

exec node dist/server.js
