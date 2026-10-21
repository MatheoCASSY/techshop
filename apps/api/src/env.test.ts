import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('applique les valeurs par défaut', () => {
    const env = loadEnv({ DATABASE_URL: 'file:./x.db' });
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
  });

  it('échoue si DATABASE_URL est absente', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });
});
