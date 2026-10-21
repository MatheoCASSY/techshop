import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  buildTestApp,
  createProduct,
  createUser,
  login,
  prisma,
  resetDb,
  type TestApp,
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

async function postReview(slug: string, cookies: Record<string, string>, payload: object) {
  return app.inject({ method: 'POST', url: `/api/products/${slug}/reviews`, cookies, payload });
}

describe('avis produits', () => {
  it('exige une session pour publier un avis', async () => {
    await createProduct({ slug: 'p' });
    const response = await app.inject({
      method: 'POST',
      url: '/api/products/p/reviews',
      payload: { rating: 5, comment: 'Top' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('publie un avis et met à jour la note moyenne du produit', async () => {
    await createProduct({ slug: 'p' });
    const alice = await createUser({ name: 'Alice' });
    const bob = await createUser({ name: 'Bob' });

    const created = await postReview('p', await login(app, alice.email), {
      rating: 5,
      comment: 'Excellent',
    });
    await postReview('p', await login(app, bob.email), { rating: 2, comment: 'Décevant' });

    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ rating: 5, authorName: 'Alice' });

    const product = await app.inject({ method: 'GET', url: '/api/products/p' });
    expect(product.json()).toMatchObject({ averageRating: 3.5, reviewCount: 2 });
  });

  it('n’accepte qu’un avis par client et par produit', async () => {
    await createProduct({ slug: 'p' });
    const user = await createUser();
    const cookies = await login(app, user.email);

    await postReview('p', cookies, { rating: 4, comment: 'Bien' });
    const second = await postReview('p', cookies, { rating: 1, comment: 'Changé d’avis' });

    expect(second.statusCode).toBe(409);
  });

  it('refuse une note hors de l’intervalle 1 à 5', async () => {
    await createProduct({ slug: 'p' });
    const user = await createUser();
    const response = await postReview('p', await login(app, user.email), {
      rating: 6,
      comment: 'Trop bien',
    });
    expect(response.statusCode).toBe(400);
  });

  it('liste les avis du plus récent au plus ancien', async () => {
    const product = await createProduct({ slug: 'p' });
    const user = await createUser({ name: 'Alice' });
    await prisma.review.create({
      data: { rating: 4, comment: 'Ancien', userId: user.id, productId: product.id },
    });

    const response = await app.inject({ method: 'GET', url: '/api/products/p/reviews' });

    expect(response.json()).toEqual([
      expect.objectContaining({ comment: 'Ancien', authorName: 'Alice' }),
    ]);
  });
});
