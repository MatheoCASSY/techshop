import { describe, expect, it } from 'vitest';
import { makeProduct } from '../../test/fixtures';
import { cartCount, cartReducer, cartTotalCents, clampQuantity, parseStoredCart } from './cart';

const product = makeProduct({ id: 'p1', priceCents: 1_000, stock: 5 });

describe('cartReducer', () => {
  it('ajoute un produit', () => {
    const items = cartReducer([], { type: 'add', product, quantity: 2 });
    expect(items).toEqual([expect.objectContaining({ productId: 'p1', quantity: 2 })]);
  });

  it('cumule les quantités d’un même produit sans dépasser le stock', () => {
    let items = cartReducer([], { type: 'add', product, quantity: 3 });
    items = cartReducer(items, { type: 'add', product, quantity: 4 });
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(5);
  });

  it('modifie puis retire une ligne', () => {
    let items = cartReducer([], { type: 'add', product, quantity: 1 });
    items = cartReducer(items, { type: 'setQuantity', productId: 'p1', quantity: 3 });
    expect(items[0]?.quantity).toBe(3);
    items = cartReducer(items, { type: 'remove', productId: 'p1' });
    expect(items).toEqual([]);
  });

  it('calcule le total et le nombre d’articles', () => {
    let items = cartReducer([], { type: 'add', product, quantity: 2 });
    items = cartReducer(items, {
      type: 'add',
      product: makeProduct({ id: 'p2', priceCents: 500 }),
      quantity: 1,
    });
    expect(cartTotalCents(items)).toBe(2_500);
    expect(cartCount(items)).toBe(3);
  });
});

describe('clampQuantity', () => {
  it('borne entre 1, le stock et la limite par produit', () => {
    expect(clampQuantity(0, 5)).toBe(1);
    expect(clampQuantity(8, 5)).toBe(5);
    expect(clampQuantity(50, 100)).toBe(10);
  });
});

describe('parseStoredCart', () => {
  it('ignore un contenu corrompu', () => {
    expect(parseStoredCart('{pas du json')).toEqual([]);
    expect(parseStoredCart('{"a":1}')).toEqual([]);
  });

  it('écarte les lignes invalides', () => {
    const stored = JSON.stringify([
      {
        productId: 'p1',
        slug: 's',
        name: 'n',
        imageUrl: 'u',
        unitPriceCents: 1,
        stock: 1,
        quantity: 1,
      },
      { productId: 'p2', quantity: -3 },
    ]);
    expect(parseStoredCart(stored)).toHaveLength(1);
  });
});
