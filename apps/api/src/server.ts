import { buildApp } from './app.js';
import { loadEnv } from './env.js';
import { prisma } from './lib/prisma.js';

const env = loadEnv();
const app = await buildApp({
  env,
  prisma,
  logger: env.NODE_ENV === 'development' ? { transport: { target: 'pino-pretty' } } : true,
});

const shutdown = async (signal: string) => {
  app.log.info(`${signal} reçu, arrêt propre…`);
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ host: env.HOST, port: env.PORT });
