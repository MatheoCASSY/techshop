import { describe, expect, it } from 'vitest';
import { productInputSchema } from './product.js';
import { slugify } from './slug.js';

describe('slugify', () => {
  it('retire les accents et la ponctuation', () => {
    expect(slugify('Écran 27" 4K IPS')).toBe('ecran-27-4k-ips');
  });

  it('ne laisse pas de tiret en début ou en fin', () => {
    expect(slugify('  -- Hub USB-C 8-en-1 !  ')).toBe('hub-usb-c-8-en-1');
  });

  it('produit un slug accepté par le schéma produit', () => {
    expect(productInputSchema.shape.slug.safeParse(slugify('Câble USB-C tressé 2 m')).success).toBe(
      true,
    );
  });
});
