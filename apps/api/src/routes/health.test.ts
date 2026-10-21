import type { PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app.js';
import { buildTestApp, prisma, testEnv } from '../../test/helpers.js';

afterAll(() => prisma.$disconnect());

describe('GET /api/health', () => {
  it('répond ok quand la base est joignable', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', database: 'up' });
    await app.close();
  });

  it('répond 503 quand la base est injoignable', async () => {
    const brokenPrisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('connexion refusée')),
    } as unknown as PrismaClient;
    const app = await buildApp({ env: testEnv, prisma: brokenPrisma });
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: 'degraded', database: 'down' });
    await app.close();
  });

  it('ajoute les en-têtes de sécurité (helmet)', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    await app.close();
  });

  it('renvoie un 404 JSON pour une route inconnue', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/nexiste-pas' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'Route introuvable' });
    await app.close();
  });
});
