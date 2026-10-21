import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { ZodError } from 'zod';
import type { Env } from './env.js';
import { registerAuth } from './plugins/auth.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { catalogRoutes } from './routes/catalog.js';
import { healthRoutes } from './routes/health.js';
import { orderRoutes } from './routes/orders.js';
import { reviewRoutes } from './routes/reviews.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export interface AppDeps {
  env: Pick<Env, 'CORS_ORIGIN' | 'JWT_SECRET' | 'NODE_ENV' | 'AUTH_RATE_LIMIT'>;
  prisma: PrismaClient;
  logger?: FastifyServerOptions['logger'];
}

/** Construit l'application sans écouter de port : utilisable telle quelle dans les tests. */
export async function buildApp({ env, prisma, logger = false }: AppDeps) {
  const app = Fastify({ logger, bodyLimit: 100 * 1024 });

  app.decorate('prisma', prisma);
  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN.split(','), credentials: true });
  // Limitation activée route par route (authentification)
  await app.register(rateLimit, { global: false });
  await registerAuth(app, env);

  app.setErrorHandler<Error & { statusCode?: number }>((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'Données invalides',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) request.log.error(error);
    // On ne renvoie jamais le détail d'une erreur serveur au client
    return reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Erreur interne du serveur' : error.message,
    });
  });

  app.setNotFoundHandler((_request, reply) => reply.code(404).send({ error: 'Route introuvable' }));

  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(authRoutes, { rateLimitMax: env.AUTH_RATE_LIMIT });
      await api.register(catalogRoutes);
      await api.register(reviewRoutes);
      await api.register(orderRoutes);
      await api.register(adminRoutes);
    },
    { prefix: '/api' },
  );

  return app;
}
