import type { Paginated, Product } from '@techshop/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildTestApp, createProduct, prisma, resetDb, type TestApp } from '../../test/helpers.js';

let app: TestApp;

beforeAll(async () => {
  app = await buildTestApp();
  await resetDb();
  await createProduct({ name: 'UltraBook Air', slug: 'ultrabook-air', priceCents: 109_900 });
  await createProduct({ name: 'Gaming Blade', slug: 'gaming-blade', priceCents: 179_900 });
  await createProduct({
    name: 'Casque StudioMax',
    slug: 'casque-studiomax',
    priceCents: 39_900,
    category: 'audio',
    description: 'Réduction de bruit active',
    createdAt: new Date('2030-01-01'),
  });
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const list = async (query = '') => {
  const response = await app.inject({ method: 'GET', url: `/api/products${query}` });
  return { status: response.statusCode, body: response.json<Paginated<Product>>() };
};

const names = (body: Paginated<Product>) => body.items.map((p) => p.name);

describe('GET /api/products', () => {
  it('liste les produits avec la pagination', async () => {
    const { status, body } = await list();

    expect(status).toBe(200);
    expect(body).toMatchObject({ page: 1, pageSize: 12, total: 3, totalPages: 1 });
  });

  it('recherche dans le nom, sans tenir compte de la casse', async () => {
    expect(names((await list('?q=ultrabook')).body)).toEqual(['UltraBook Air']);
  });

  it('recherche aussi dans la description', async () => {
    expect(names((await list('?q=bruit')).body)).toEqual(['Casque StudioMax']);
  });

  it('filtre par catégorie', async () => {
    expect(names((await list('?category=audio')).body)).toEqual(['Casque StudioMax']);
  });

  it('filtre par fourchette de prix (en centimes)', async () => {
    const { body } = await list('?minPrice=50000&maxPrice=150000');
    expect(names(body)).toEqual(['UltraBook Air']);
  });

  it('trie par prix croissant', async () => {
    const { body } = await list('?sort=price-asc');
    expect(names(body)).toEqual(['Casque StudioMax', 'UltraBook Air', 'Gaming Blade']);
  });

  it('trie par nouveauté', async () => {
    const { body } = await list('?sort=newest');
    expect(body.items[0]?.name).toBe('Casque StudioMax');
  });

  it('pagine les résultats', async () => {
    const { body } = await list('?pageSize=2&page=2&sort=price-asc');
    expect(body).toMatchObject({ page: 2, totalPages: 2, total: 3 });
    expect(names(body)).toEqual(['Gaming Blade']);
  });

  it('refuse une catégorie inconnue', async () => {
    expect((await list('?category=jardin')).status).toBe(400);
  });
});

describe('GET /api/products/:slug', () => {
  it('renvoie la fiche produit', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/products/gaming-blade' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      name: 'Gaming Blade',
      category: 'laptops',
      averageRating: null,
      reviewCount: 0,
    });
  });

  it('renvoie 404 pour un produit inconnu', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/products/inconnu' });
    expect(response.statusCode).toBe(404);
  });
});

describe('GET /api/categories', () => {
  it('compte les produits de chaque catégorie', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/categories' });

    expect(response.json()).toEqual(
      expect.arrayContaining([
        { slug: 'laptops', name: 'laptops', productCount: 2 },
        { slug: 'audio', name: 'audio', productCount: 1 },
      ]),
    );
  });
});
