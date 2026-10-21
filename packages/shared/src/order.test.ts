import { describe, expect, it } from 'vitest';
import { canTransition, checkoutSchema, isFutureExpiry, isValidLuhn } from './order.js';

const validCheckout = {
  items: [{ productId: 'p1', quantity: 2 }],
  shipping: {
    name: 'Ada Lovelace',
    address: '1 rue des Tests',
    city: 'Nantes',
    zip: '44000',
    country: 'France',
  },
  payment: { cardNumber: '4242 4242 4242 4242', expiry: '12/99', cvc: '123' },
};

describe('isValidLuhn', () => {
  it('accepte une carte de test valide', () => {
    expect(isValidLuhn('4242424242424242')).toBe(true);
  });

  it('refuse un numéro avec une faute de frappe', () => {
    expect(isValidLuhn('4242424242424241')).toBe(false);
  });

  it('refuse un numéro trop court', () => {
    expect(isValidLuhn('4242')).toBe(false);
  });
});

describe('isFutureExpiry', () => {
  const now = new Date(2026, 9, 21); // 21 octobre 2026

  it('accepte le mois en cours', () => {
    expect(isFutureExpiry('10/26', now)).toBe(true);
  });

  it('refuse le mois précédent', () => {
    expect(isFutureExpiry('09/26', now)).toBe(false);
  });

  it('refuse un format invalide', () => {
    expect(isFutureExpiry('13/26', now)).toBe(false);
  });
});

describe('checkoutSchema', () => {
  it('accepte une commande valide et nettoie le numéro de carte', () => {
    const parsed = checkoutSchema.parse(validCheckout);
    expect(parsed.payment.cardNumber).toBe('4242424242424242');
  });

  it('refuse un panier vide', () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, items: [] }).success).toBe(false);
  });

  it('refuse une quantité excessive', () => {
    const items = [{ productId: 'p1', quantity: 99 }];
    expect(checkoutSchema.safeParse({ ...validCheckout, items }).success).toBe(false);
  });
});

describe('canTransition', () => {
  it('autorise pending → paid', () => {
    expect(canTransition('pending', 'paid')).toBe(true);
  });

  it('interdit de rouvrir une commande livrée', () => {
    expect(canTransition('delivered', 'pending')).toBe(false);
  });
});
