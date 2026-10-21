import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('vérifie le bon mot de passe et refuse un mauvais', async () => {
    const hash = await hashPassword('s3cret!');
    expect(await verifyPassword('s3cret!', hash)).toBe(true);
    expect(await verifyPassword('autre', hash)).toBe(false);
  });

  it('sale chaque hash différemment', async () => {
    expect(await hashPassword('identique')).not.toBe(await hashPassword('identique'));
  });

  it('refuse un hash mal formé', async () => {
    expect(await verifyPassword('x', 'pas-un-hash')).toBe(false);
  });
});
