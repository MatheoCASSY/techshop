import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

const base = { DATABASE_URL: 'file:./x.db', JWT_SECRET: 'x'.repeat(32) };

describe('loadEnv', () => {
  it('applique les valeurs par défaut', () => {
    const env = loadEnv(base);
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.AUTH_RATE_LIMIT).toBe(10);
  });

  it('échoue si DATABASE_URL est absente', () => {
    expect(() => loadEnv({ JWT_SECRET: base.JWT_SECRET })).toThrow(/DATABASE_URL/);
  });

  it('refuse un secret JWT trop court', () => {
    expect(() => loadEnv({ ...base, JWT_SECRET: 'court' })).toThrow(/JWT_SECRET/);
  });

  it('refuse la valeur d’exemple du secret en production', () => {
    const placeholder = 'remplacer-par-une-valeur-aleatoire-de-32-caracteres-minimum';
    expect(() => loadEnv({ ...base, NODE_ENV: 'production', JWT_SECRET: placeholder })).toThrow(
      /JWT_SECRET/,
    );
    expect(() => loadEnv({ ...base, JWT_SECRET: placeholder })).not.toThrow();
  });
});
