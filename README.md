# techshop

[![CI](https://github.com/MatheoCASSY/techshop/actions/workflows/ci.yml/badge.svg)](https://github.com/MatheoCASSY/techshop/actions/workflows/ci.yml)

Boutique e-commerce de matériel tech, développée de zéro **uniquement avec des outils d'IA** dans le cadre d'un projet d'école, en appliquant au maximum les bonnes pratiques de développement.

> 🚧 Projet en cours : l'étape 1 (socle technique) est terminée, les fonctionnalités arrivent étape par étape.

## Fonctionnalités prévues

| Domaine     | Contenu                                                                   | État |
| ----------- | ------------------------------------------------------------------------- | ---- |
| Socle       | Monorepo, API, front, base de données, seed, CI, Docker                   | ✅   |
| Catalogue   | Recherche, filtres (catégorie, prix), tri, pagination, fiche produit      | ⏳   |
| Panier      | Ajout / retrait / quantités, persistant                                   | ⏳   |
| Compte      | Inscription, connexion (JWT en cookie httpOnly), historique des commandes | ⏳   |
| Checkout    | Formulaire de livraison validé, paiement **factice**                      | ⏳   |
| Avis        | Note et commentaire, un avis par client et par produit                    | ⏳   |
| Back-office | CRUD produits, stock, gestion des statuts de commande (rôle admin)        | ⏳   |
| UX          | Thème clair/sombre, responsive, accessibilité, i18n FR/EN                 | ⏳   |

## Stack

- **Front** : React 19, Vite, TypeScript strict, Tailwind CSS 4
- **API** : Fastify 5, Prisma 6, SQLite, Zod
- **Partagé** : `@techshop/shared`, les schémas Zod communs au front et à l'API (une seule source de vérité pour la validation)
- **Qualité** : Vitest, Testing Library, ESLint, Prettier, Husky, commitlint, lint-staged
- **Livraison** : GitHub Actions, Docker (images multi-étapes, utilisateur non root), docker compose

```
techshop/
├── apps/
│   ├── api/        # API Fastify + Prisma
│   └── web/        # SPA React + Vite
├── packages/
│   └── shared/     # Schémas Zod et utilitaires partagés
└── .github/workflows/ci.yml
```

## Démarrage rapide

### Avec Docker (le plus simple)

```bash
cp .env.example .env          # puis choisir un SEED_ADMIN_PASSWORD
docker compose up --build
```

L'application est servie sur <http://localhost:8080>. Au premier démarrage, la base est créée et peuplée automatiquement. Les données sont conservées dans un volume Docker.

### En local

Prérequis : Node.js 22 (voir `.nvmrc`).

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run build -w @techshop/shared
npm run db:push -w @techshop/api
npm run db:seed -w @techshop/api
npm run dev                   # API sur :3000, front sur :5173
```

Compte admin du seed : `admin@techshop.local`, avec le mot de passe défini dans `SEED_ADMIN_PASSWORD`.

## Scripts

| Commande            | Rôle                                    |
| ------------------- | --------------------------------------- |
| `npm run dev`       | API et front en mode watch              |
| `npm test`          | Tests de tous les paquets               |
| `npm run lint`      | ESLint                                  |
| `npm run typecheck` | Vérification TypeScript                 |
| `npm run format`    | Formatage Prettier                      |
| `npm run build`     | Build de production de tous les paquets |

## Bonnes pratiques appliquées

- **Validation aux frontières** : variables d'environnement, query strings et corps de requête validés par Zod.
- **Prix en centimes** (entiers) pour éviter les erreurs d'arrondi des flottants.
- **Sécurité** : en-têtes helmet, CORS restreint, mots de passe hachés (scrypt et comparaison à temps constant), erreurs serveur jamais détaillées au client, aucun secret dans le dépôt (`.env.example` uniquement), conteneurs non root.
- **Testabilité** : l'application Fastify est construite par une fabrique (`buildApp`) à laquelle on injecte ses dépendances, et les tests tournent sur une base SQLite jetable.
- **Conventions Git** : [Conventional Commits](https://www.conventionalcommits.org/fr/) vérifiés par commitlint, lint et formatage automatiques avant chaque commit, une branche et une PR par fonctionnalité.
- **CI** : lint, formatage, types, tests et build à chaque push et PR, puis build des images Docker.

## Licence

[MIT](LICENSE)
