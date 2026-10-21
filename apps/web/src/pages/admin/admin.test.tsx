import type { Order } from '@techshop/shared';
import { screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { mockApi, renderWithProviders } from '../../test/render';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AdminProductFormPage } from './AdminProductFormPage';

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 'cmorder0000000000abcd1234',
  status: 'paid',
  totalCents: 12_900,
  createdAt: '2026-10-21T10:00:00.000Z',
  shipping: { name: 'Ada', address: '1 rue X', city: 'Nantes', zip: '44000', country: 'France' },
  items: [],
  customer: { name: 'Ada Lovelace', email: 'ada@test.local' },
  ...overrides,
});

describe('AdminProductFormPage', () => {
  it('génère le slug depuis le nom et envoie le prix en centimes', async () => {
    let body: unknown;
    mockApi({
      'GET /api/admin/products': () => Response.json([]),
      'POST /api/admin/products': (_url, init) => {
        body = JSON.parse(String(init?.body));
        return Response.json({ id: 'new' }, { status: 201 });
      },
    });
    const { user } = renderWithProviders(
      <Routes>
        <Route path="/admin/produits/nouveau" element={<AdminProductFormPage />} />
        <Route path="/admin/produits" element={<p>Liste</p>} />
      </Routes>,
      { route: '/admin/produits/nouveau' },
    );

    await user.type(screen.getByLabelText('Nom'), 'Écran 27" 4K');
    expect(screen.getByLabelText('Slug (URL)')).toHaveValue('ecran-27-4k');

    const price = screen.getByLabelText('Prix (€)');
    await user.clear(price);
    await user.type(price, '449.9');
    await user.clear(screen.getByLabelText('Stock'));
    await user.type(screen.getByLabelText('Stock'), '12');
    await user.type(screen.getByLabelText('URL de l’image'), 'https://placehold.co/640x480.png');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Liste')).toBeInTheDocument();
    expect(body).toMatchObject({ slug: 'ecran-27-4k', priceCents: 44_990, stock: 12 });
  });
});

describe('AdminOrdersPage', () => {
  it('ne propose que les transitions autorisées et envoie le nouveau statut', async () => {
    let patched: unknown;
    mockApi({
      'GET /api/admin/orders': () =>
        Response.json([order(), order({ id: 'cmorder0000000000delivered', status: 'delivered' })]),
      'PATCH /api/admin/orders/cmorder0000000000abcd1234/status': (_url, init) => {
        patched = JSON.parse(String(init?.body));
        return Response.json(order({ status: 'shipped' }));
      },
    });
    const { user } = renderWithProviders(<AdminOrdersPage />, { route: '/admin/commandes' });

    const select = await screen.findByLabelText('Changer le statut de la commande abcd1234');
    const options = within(select)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual(['Payée →', 'Expédiée', 'Annulée']);
    // Une commande livrée est figée
    expect(screen.getByText('Statut définitif')).toBeInTheDocument();

    await user.selectOptions(select, 'Expédiée');
    await waitFor(() => expect(patched).toEqual({ status: 'shipped' }));
  });
});
