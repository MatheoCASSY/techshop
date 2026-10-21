import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (_request, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch (error) {
      app.log.error(error, 'Base de données injoignable');
      return reply.code(503).send({ status: 'degraded', database: 'down' });
    }
  });
};
