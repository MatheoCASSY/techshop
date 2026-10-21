import { loginSchema, registerSchema } from '@techshop/shared';
import type { FastifyPluginAsync } from 'fastify';
import { conflict, HttpError, isUniqueViolation, notFound } from '../lib/errors.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { toPublicUser } from '../lib/serializers.js';

interface AuthRoutesOptions {
  rateLimitMax: number;
}

// Hash factice : vérifié quand l'email est inconnu, pour que le temps de réponse
// ne révèle pas si un compte existe (énumération des utilisateurs)
const DUMMY_HASH = await hashPassword('dummy-password-for-timing');

export const authRoutes: FastifyPluginAsync<AuthRoutesOptions> = async (app, { rateLimitMax }) => {
  const rateLimit = { rateLimit: { max: rateLimitMax, timeWindow: '1 minute' } };

  app.post('/auth/register', { config: rateLimit }, async (request, reply) => {
    const input = registerSchema.parse(request.body);
    try {
      const user = await app.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: await hashPassword(input.password),
        },
      });
      await reply.setSession({ sub: user.id, role: 'customer' });
      return reply.code(201).send(toPublicUser(user));
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflict('Un compte existe déjà avec cet email');
      }
      throw error;
    }
  });

  app.post('/auth/login', { config: rateLimit }, async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const user = await app.prisma.user.findUnique({ where: { email: input.email } });
    const valid = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) {
      // Message volontairement identique dans les deux cas
      throw new HttpError(401, 'Email ou mot de passe incorrect');
    }
    await reply.setSession({ sub: user.id, role: user.role === 'admin' ? 'admin' : 'customer' });
    return toPublicUser(user);
  });

  app.post('/auth/logout', async (_request, reply) => {
    return reply.clearSession().code(204).send();
  });

  app.get('/auth/me', { preHandler: app.authenticate }, async (request) => {
    const user = await app.prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user) throw notFound('Utilisateur introuvable');
    return toPublicUser(user);
  });
};
