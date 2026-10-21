import { describe, expect, it } from 'vitest';
import { productQuerySchema } from './product.js';

describe('productQuerySchema', () => {
  it('applique les valeurs par défaut', () => {
    expect(productQuerySchema.parse({})).toEqual({ sort: 'relevance', page: 1, pageSize: 12 });
  });

  it('convertit les nombres issus de la query string', () => {
    const query = productQuerySchema.parse({ minPrice: '1000', page: '2' });
    expect(query.minPrice).toBe(1000);
    expect(query.page).toBe(2);
  });

  it('refuse une fourchette de prix inversée', () => {
    expect(productQuerySchema.safeParse({ minPrice: 5000, maxPrice: 1000 }).success).toBe(false);
  });

  it('refuse une catégorie inconnue', () => {
    expect(productQuerySchema.safeParse({ category: 'jardin' }).success).toBe(false);
  });

  it('plafonne la taille de page', () => {
    expect(productQuerySchema.safeParse({ pageSize: 500 }).success).toBe(false);
  });
});
