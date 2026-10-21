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

beforeAll(async () => {
  app = await buildTestApp();
});
beforeEach(resetDb);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

async function customerSession() {
  const user = await createUser();
  return { user, cookies: await login(app, user.email) };
}

const checkout = (cookies: Record<string, string>, payload: object) =>
  app.inject({ method: 'POST', url: '/api/orders', cookies, payload });

describe('POST /api/orders', () => {
  it('exige une session', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/orders', payload: {} });
    expect(response.statusCode).toBe(401);
  });

  it('crée la commande, décrémente le stock et calcule le total avec les prix de la base', async () => {
    const product = await createProduct({ priceCents: 2_500, stock: 5 });
    const { cookies } = await customerSession();

    const response = await checkout(cookies, {
      // Un prix envoyé par le client est ignoré
      items: [{ productId: product.id, quantity: 2, unitPriceCents: 1 }],
      shipping: validShipping,
      payment: validPayment,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ status: 'paid', totalCents: 5_000 });
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(3);
  });

  it('fusionne les lignes d’un même produit', async () => {
    const product = await createProduct({ stock: 10 });
    const { cookies } = await customerSession();

    const response = await checkout(cookies, {
      items: [
        { productId: product.id, quantity: 1 },
        { productId: product.id, quantity: 2 },
      ],
      shipping: validShipping,
      payment: validPayment,
    });

    expect(response.json().items).toEqual([expect.objectContaining({ quantity: 3 })]);
  });

  it('refuse la commande et ne touche à aucun stock si un article manque', async () => {
    const available = await createProduct({ stock: 5 });
    const scarce = await createProduct({ name: 'Rare', stock: 1 });
    const { cookies } = await customerSession();

    const response = await checkout(cookies, {
      items: [
        { productId: available.id, quantity: 2 },
        { productId: scarce.id, quantity: 2 },
      ],
      shipping: validShipping,
      payment: validPayment,
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error).toContain('Rare');
    // Transaction annulée : le premier décrément est lui aussi défait
    expect((await prisma.product.findUniqueOrThrow({ where: { id: available.id } })).stock).toBe(5);
    expect(await prisma.order.count()).toBe(0);
  });

  it('simule un refus de paiement avec la carte de test dédiée', async () => {
    const product = await createProduct();
    const { cookies } = await customerSession();

    const response = await checkout(cookies, {
      items: [{ productId: product.id, quantity: 1 }],
      shipping: validShipping,
      payment: { ...validPayment, cardNumber: '4000 0000 0000 0002' },
    });

    expect(response.statusCode).toBe(402);
    expect(await prisma.order.count()).toBe(0);
  });

  it('refuse un numéro de carte invalide', async () => {
    const product = await createProduct();
    const { cookies } = await customerSession();

    const response = await checkout(cookies, {
      items: [{ productId: product.id, quantity: 1 }],
      shipping: validShipping,
      payment: { ...validPayment, cardNumber: '1234 5678 9012 3456' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('refuse un produit inexistant', async () => {
    const { cookies } = await customerSession();
    const response = await checkout(cookies, {
      items: [{ productId: 'inexistant', quantity: 1 }],
      shipping: validShipping,
      payment: validPayment,
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /api/orders', () => {
  it('ne liste que les commandes du client connecté', async () => {
    const product = await createProduct();
    const alice = await customerSession();
    const bob = await customerSession();
    const payload = {
      items: [{ productId: product.id, quantity: 1 }],
      shipping: validShipping,
      payment: validPayment,
    };
    await checkout(alice.cookies, payload);
    await checkout(bob.cookies, payload);

    const response = await app.inject({
      method: 'GET',
      url: '/api/orders',
      cookies: alice.cookies,
    });

    expect(response.json()).toHaveLength(1);
  });

  it('renvoie 404 pour la commande d’un autre client', async () => {
    const product = await createProduct();
    const alice = await customerSession();
    const bob = await customerSession();
    const created = await checkout(alice.cookies, {
      items: [{ productId: product.id, quantity: 1 }],
      shipping: validShipping,
      payment: validPayment,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/orders/${created.json().id}`,
      cookies: bob.cookies,
    });

    expect(response.statusCode).toBe(404);
  });
});
