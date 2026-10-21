import { screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { makeProduct, page } from './test/fixtures';
import { mockApi, renderWithProviders } from './test/render';

/**
 * Audit d'accessibilité automatisé (axe-core, règles WCAG 2.1 A/AA) sur les pages publiques.
 * Le contraste des couleurs n'est pas vérifiable dans jsdom (pas de rendu) : il est contrôlé
 * à la main dans le navigateur.
 */
async function expectNoViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  const summary = results.violations.map(
    (v) => `${v.id} : ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
  );
  expect(summary).toEqual([]);
}

const product = makeProduct();

function mockShopApi() {
  mockApi({
    'GET /api/auth/me': () => Response.json({ error: 'Authentification requise' }, { status: 401 }),
    'GET /api/products': () => Response.json(page([product, makeProduct({ id: 'p2', slug: 'b' })])),
    [`GET /api/products/${product.slug}`]: () => Response.json(product),
    [`GET /api/products/${product.slug}/reviews`]: () =>
      Response.json([
        {
          id: 'r1',
          rating: 4,
          comment: 'Très bon produit',
          authorName: 'Ada',
          createdAt: '2026-10-01T10:00:00.000Z',
        },
      ]),
  });
}

describe('accessibilité (axe-core)', () => {
  it('détecte bien une violation (témoin : l’audit ne passe pas à vide)', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<img src="x.png"><button></button>';
    document.body.append(container);
    const results = await axe.run(container, { runOnly: { type: 'tag', values: ['wcag2a'] } });
    container.remove();

    expect(results.violations.map((v) => v.id)).toEqual(
      expect.arrayContaining(['image-alt', 'button-name']),
    );
  });

  it.each([
    ['accueil', '/', 'Le matériel tech qu’il vous faut'],
    ['catalogue', '/catalogue', 'Catalogue'],
    ['fiche produit', `/produits/${product.slug}`, product.name],
    ['panier', '/panier', 'Mon panier'],
    ['connexion', '/connexion', 'Connexion'],
    ['inscription', '/inscription', 'Créer un compte'],
    ['404', '/nexiste-pas', 'Page introuvable'],
  ])('page %s : aucune violation', async (_name, route, heading) => {
    mockShopApi();
    const { container } = renderWithProviders(<App />, { route });

    await screen.findByRole('heading', { level: 1, name: heading });
    await expectNoViolations(container);
  });
});
