import { describe, expect, it } from 'vitest';
import { formatPrice } from './money.js';

// Intl utilise des espaces insécables : on les normalise pour comparer
const normalize = (s: string) => s.replace(/\s/g, ' ');

describe('formatPrice', () => {
  it('formate des centimes en euros (fr-FR)', () => {
    expect(normalize(formatPrice(129900))).toBe('1 299,00 €');
  });

  it('formate en anglais', () => {
    expect(formatPrice(1999, 'en-US')).toBe('€19.99');
  });
});
