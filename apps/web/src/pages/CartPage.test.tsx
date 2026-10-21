import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CartItem } from '../features/cart/cart';
import { renderWithProviders } from '../test/render';
import { CartPage } from './CartPage';

const storeCart = (items: CartItem[]) =>
  window.localStorage.setItem('techshop.cart', JSON.stringify(items));

const item: CartItem = {
  productId: 'p1',
  slug: 'casque',
  name: 'Casque',
  imageUrl: 'https://picsum.photos/seed/x/640/480',
  unitPriceCents: 2_000,
  stock: 5,
  quantity: 2,
};

describe('CartPage', () => {
  it('indique un panier vide', () => {
    renderWithProviders(<CartPage />);
    expect(screen.getByText('Votre panier est vide.')).toBeInTheDocument();
  });

  it('restaure le panier sauvegardé et calcule le total', () => {
    storeCart([item]);
    renderWithProviders(<CartPage />);

    expect(screen.getByRole('link', { name: 'Casque' })).toBeInTheDocument();
    expect(screen.getAllByText(/40,00\s€/).length).toBeGreaterThan(0);
  });

  it('met à jour la quantité et persiste le panier', async () => {
    storeCart([item]);
    const { user } = renderWithProviders(<CartPage />);

    await user.click(screen.getByRole('button', { name: 'Augmenter la quantité' }));

    expect(screen.getByLabelText('Quantité pour Casque')).toHaveValue(3);
    expect(JSON.parse(window.localStorage.getItem('techshop.cart') ?? '[]')[0].quantity).toBe(3);
  });

  it('retire un article', async () => {
    storeCart([item]);
    const { user } = renderWithProviders(<CartPage />);

    await user.click(screen.getByRole('button', { name: 'Retirer Casque du panier' }));

    expect(screen.getByText('Votre panier est vide.')).toBeInTheDocument();
  });
});
