import { PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';

const prisma = new PrismaClient();
const env = { CORS_ORIGIN: 'http://localhost:5173' };

afterAll(() => prisma.$disconnect());

describe('GET /api/health', () => {
  it('répond ok quand la base est joignable', async () => {
    const app = await buildApp({ env, prisma });
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', database: 'up' });
    await app.close();
  });

  it('répond 503 quand la base est injoignable', async () => {
    const brokenPrisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('connexion refusée')),
    } as unknown as PrismaClient;
    const app = await buildApp({ env, prisma: brokenPrisma });
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'degraded', database: 'down' });
    await app.close();
  });

  it('ajoute les en-têtes de sécurité (helmet)', async () => {
    const app = await buildApp({ env, prisma });
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    await app.close();
  });
});
