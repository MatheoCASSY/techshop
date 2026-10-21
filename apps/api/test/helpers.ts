import { PrismaClient } from '@prisma/client';
import type { CategorySlug } from '@techshop/shared';
import { type AppDeps, buildApp } from '../src/app.js';
import { hashPassword } from '../src/lib/password.js';
import { AUTH_COOKIE } from '../src/plugins/auth.js';

export const prisma = new PrismaClient();

export const testEnv: AppDeps['env'] = {
  CORS_ORIGIN: 'http://localhost:5173',
  JWT_SECRET: 'secret-de-test-suffisamment-long-pour-hs256',
  NODE_ENV: 'test',
  AUTH_RATE_LIMIT: 1000,
};

export type TestApp = Awaited<ReturnType<typeof buildApp>>;

export const buildTestApp = (env: Partial<AppDeps['env']> = {}) =>
  buildApp({ env: { ...testEnv, ...env }, prisma });

/** Vide toutes les tables, dans l'ordre inverse des clés étrangères. */
export async function resetDb() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

export const PASSWORD = 'mot-de-passe-test';
// Le hachage scrypt est volontairement lent : on le calcule une seule fois
const passwordHash = hashPassword(PASSWORD);

let sequence = 0;
const next = () => ++sequence;

export async function createUser(data: { email?: string; name?: string; role?: string } = {}) {
  const n = next();
  return prisma.user.create({
    data: {
      email: data.email ?? `client${n}@test.local`,
      name: data.name ?? `Client ${n}`,
      role: data.role ?? 'customer',
      passwordHash: await passwordHash,
    },
  });
}

/** Connecte un utilisateur et renvoie le cookie de session à passer à `app.inject`. */
export async function login(app: TestApp, email: string, password = PASSWORD) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password },
  });
  const cookie = response.cookies.find((c) => c.name === AUTH_COOKIE);
  if (!cookie) throw new Error(`Connexion impossible (${response.statusCode}) : ${response.body}`);
  return { [AUTH_COOKIE]: cookie.value };
}

export async function createProduct(
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    stock: number;
    category: CategorySlug;
    createdAt: Date;
  }> = {},
) {
  const n = next();
  const slug = data.category ?? 'laptops';
  const category = await prisma.category.upsert({
    where: { slug },
    update: {},
    create: { slug, name: slug },
  });
  return prisma.product.create({
    data: {
      name: data.name ?? `Produit ${n}`,
      slug: data.slug ?? `produit-${n}`,
      description: data.description ?? 'Description de test',
      priceCents: data.priceCents ?? 10_000,
      stock: data.stock ?? 10,
      imageUrl: 'https://picsum.photos/seed/test/640/480',
      categoryId: category.id,
      ...(data.createdAt && { createdAt: data.createdAt }),
    },
  });
}

export const validShipping = {
  name: 'Ada Lovelace',
  address: '1 rue des Tests',
  city: 'Nantes',
  zip: '44000',
  country: 'France',
};

export const validPayment = { cardNumber: '4242 4242 4242 4242', expiry: '12/99', cvc: '123' };
