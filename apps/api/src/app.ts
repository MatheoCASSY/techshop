import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyServerOptions } from 'fastify';
import type { Env } from './env.js';
import { healthRoutes } from './routes/health.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export interface AppDeps {
  env: Pick<Env, 'CORS_ORIGIN'>;
  prisma: PrismaClient;
  logger?: FastifyServerOptions['logger'];
}

/** Construit l'application sans écouter de port : utilisable telle quelle dans les tests. */
export async function buildApp({ env, prisma, logger = false }: AppDeps) {
  const app = Fastify({ logger });

  app.decorate('prisma', prisma);
  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN.split(','), credentials: true });

  app.setErrorHandler<Error & { statusCode?: number }>((error, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) request.log.error(error);
    // On ne renvoie jamais le détail d'une erreur serveur au client
    reply.code(statusCode).send({
      error: statusCode >= 500 ? 'Erreur interne du serveur' : error.message,
    });
  });

  await app.register(healthRoutes, { prefix: '/api' });

  return app;
}
