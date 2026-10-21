import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeProduct, page } from '../test/fixtures';
import { mockApi, renderWithProviders } from '../test/render';
import { CatalogPage } from './CatalogPage';

describe('CatalogPage', () => {
  it('affiche les produits et leur nombre', async () => {
    mockApi({
      'GET /api/products': () =>
        Response.json(page([makeProduct(), makeProduct({ id: 'p2', slug: 'b', name: 'Casque' })])),
    });
    renderWithProviders(<CatalogPage />, { route: '/catalogue' });

    expect(await screen.findByRole('link', { name: 'UltraBook Air 14' })).toBeInTheDocument();
    expect(screen.getByText('2 produits')).toBeInTheDocument();
  });

  it('transmet la recherche et les filtres de l’URL à l’API', async () => {
    const api = mockApi({ 'GET /api/products': () => Response.json(page([])) });
    renderWithProviders(<CatalogPage />, {
      route: '/catalogue?q=casque&category=audio&sort=price-asc',
    });

    expect(await screen.findByText(/Aucun produit/)).toBeInTheDocument();
    const url = new URL(String(api.mock.calls[0]?.[0]), 'http://localhost');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      q: 'casque',
      category: 'audio',
      sort: 'price-asc',
    });
  });

  it('change de tri et recharge les produits', async () => {
    const api = mockApi({ 'GET /api/products': () => Response.json(page([makeProduct()])) });
    const { user } = renderWithProviders(<CatalogPage />, { route: '/catalogue' });

    await screen.findByRole('link', { name: 'UltraBook Air 14' });
    await user.selectOptions(screen.getByLabelText('Trier par'), 'Prix décroissant');

    await screen.findByRole('link', { name: 'UltraBook Air 14' });
    const lastUrl = new URL(String(api.mock.calls.at(-1)?.[0]), 'http://localhost');
    expect(lastUrl.searchParams.get('sort')).toBe('price-desc');
  });

  it('affiche les prix au format français', async () => {
    mockApi({ 'GET /api/products': () => Response.json(page([makeProduct()])) });
    renderWithProviders(<CatalogPage />, { route: '/catalogue' });

    const card = (await screen.findByRole('link', { name: 'UltraBook Air 14' })).closest('article');
    expect(within(card as HTMLElement).getByText(/1\s099,00\s€/)).toBeInTheDocument();
  });
});
