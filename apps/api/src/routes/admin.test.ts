import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  buildTestApp,
  createProduct,
  createUser,
  login,
  prisma,
  resetDb,
  type TestApp,
  validPayment,
  validShipping,
} from '../../test/helpers.js';

let app: TestApp;
let adminCookies: Record<string, string>;

beforeAll(async () => {
  app = await buildTestApp();
});
beforeEach(async () => {
  await resetDb();
  const admin = await createUser({ role: 'admin' });
  adminCookies = await login(app, admin.email);
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const productInput = {
  name: 'Nouvelle souris',
  slug: 'nouvelle-souris',
  description: 'Souris sans fil',
  priceCents: 4_990,
  stock: 20,
  imageUrl: 'https://picsum.photos/seed/souris/640/480',
  category: 'peripherals',
};

async function placeOrder(productId: string, quantity = 1) {
  const customer = await createUser();
  const response = await app.inject({
    method: 'POST',
    url: '/api/orders',
    cookies: await login(app, customer.email),
    payload: { items: [{ productId, quantity }], shipping: validShipping, payment: validPayment },
  });
  return response.json<{ id: string }>();
}

describe('contrôle d’accès', () => {
  it('refuse un visiteur non connecté (401)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/admin/stats' });
    expect(response.statusCode).toBe(401);
  });

  it('refuse un client (403)', async () => {
    const customer = await createUser();
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/stats',
      cookies: await login(app, customer.email),
    });
    expect(response.statusCode).toBe(403);
  });

  it('retire les droits d’un admin rétrogradé sans attendre l’expiration du jeton', async () => {
    const admin = await createUser({ role: 'admin' });
    const cookies = await login(app, admin.email);
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'customer' } });

    const response = await app.inject({ method: 'GET', url: '/api/admin/stats', cookies });
    expect(response.statusCode).toBe(403);
  });
});

describe('produits', () => {
  beforeEach(() =>
    prisma.category.create({ data: { slug: 'peripherals', name: 'Périphériques' } }),
  );

  it('crée un produit', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/admin/products',
      cookies: adminCookies,
      payload: productInput,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ slug: 'nouvelle-souris', category: 'peripherals' });
  });

  it('refuse un slug déjà utilisé', async () => {
    const create = () =>
      app.inject({
        method: 'POST',
        url: '/api/admin/products',
        cookies: adminCookies,
        payload: productInput,
      });
    await create();
    expect((await create()).statusCode).toBe(409);
  });

  it('modifie un produit', async () => {
    const product = await createProduct();
    const response = await app.inject({
      method: 'PUT',
      url: `/api/admin/products/${product.id}`,
      cookies: adminCookies,
      payload: { ...productInput, stock: 0 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ stock: 0, name: 'Nouvelle souris' });
  });

  it('supprime un produit jamais commandé', async () => {
    const product = await createProduct();
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/admin/products/${product.id}`,
      cookies: adminCookies,
    });
    expect(response.statusCode).toBe(204);
  });

  it('refuse de supprimer un produit déjà commandé', async () => {
    const product = await createProduct();
    await placeOrder(product.id);

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/admin/products/${product.id}`,
      cookies: adminCookies,
    });
    expect(response.statusCode).toBe(409);
  });
});

describe('commandes', () => {
  const setStatus = (id: string, status: string) =>
    app.inject({
      method: 'PATCH',
      url: `/api/admin/orders/${id}/status`,
      cookies: adminCookies,
      payload: { status },
    });

  it('liste les commandes avec le client', async () => {
    const product = await createProduct();
    await placeOrder(product.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/orders?status=paid',
      cookies: adminCookies,
    });

    expect(response.json()).toEqual([
      expect.objectContaining({ customer: expect.objectContaining({ email: expect.any(String) }) }),
    ]);
  });

  it('fait avancer une commande : payée → expédiée', async () => {
    const product = await createProduct();
    const order = await placeOrder(product.id);

    const response = await setStatus(order.id, 'shipped');
    expect(response.json()).toMatchObject({ status: 'shipped' });
  });

  it('refuse une transition invalide', async () => {
    const product = await createProduct();
    const order = await placeOrder(product.id);

    expect((await setStatus(order.id, 'delivered')).statusCode).toBe(409);
  });

  it('remet le stock à jour quand une commande est annulée', async () => {
    const product = await createProduct({ stock: 5 });
    const order = await placeOrder(product.id, 3);

    await setStatus(order.id, 'cancelled');

    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(5);
  });
});

describe('GET /api/admin/stats', () => {
  it('calcule le chiffre d’affaires hors commandes annulées', async () => {
    const product = await createProduct({ priceCents: 1_000, stock: 3 });
    await placeOrder(product.id, 2);
    const cancelled = await placeOrder(product.id, 1);
    await app.inject({
      method: 'PATCH',
      url: `/api/admin/orders/${cancelled.id}/status`,
      cookies: adminCookies,
      payload: { status: 'cancelled' },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/stats',
      cookies: adminCookies,
    });

    expect(response.json()).toMatchObject({
      revenueCents: 2_000,
      orderCount: 2,
      ordersByStatus: { paid: 1, cancelled: 1 },
      lowStock: [expect.objectContaining({ id: product.id, stock: 1 })],
    });
  });
});
