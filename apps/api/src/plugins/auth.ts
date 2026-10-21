import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { Role } from '@techshop/shared';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Env } from '../env.js';
import { HttpError } from '../lib/errors.js';

export const AUTH_COOKIE = 'techshop_token';
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

interface TokenPayload {
  sub: string;
  role: Role;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
    requireAdmin: (request: FastifyRequest) => Promise<void>;
  }
  interface FastifyReply {
    setSession: (payload: TokenPayload) => Promise<void>;
    clearSession: () => FastifyReply;
  }
}

/**
 * Session par JWT stocké dans un cookie httpOnly : inaccessible au JavaScript (protège du vol
 * par XSS) et SameSite=Lax (le navigateur ne l'envoie pas sur les requêtes POST cross-site).
 */
export async function registerAuth(
  app: FastifyInstance,
  env: Pick<Env, 'JWT_SECRET' | 'NODE_ENV'>,
) {
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: AUTH_COOKIE, signed: false },
    sign: { expiresIn: SESSION_DURATION_SECONDS },
  });

  const cookieOptions = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
  };

  // Ne renvoie pas `reply` : il est « thenable », et un `await` dessus attendrait l'envoi
  // de la réponse, ce qui bloquerait le handler indéfiniment
  app.decorateReply('setSession', async function (this: FastifyReply, payload: TokenPayload) {
    const token = await this.jwtSign(payload);
    this.setCookie(AUTH_COOKIE, token, { ...cookieOptions, maxAge: SESSION_DURATION_SECONDS });
  });

  app.decorateReply('clearSession', function (this: FastifyReply) {
    return this.clearCookie(AUTH_COOKIE, cookieOptions);
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new HttpError(401, 'Authentification requise');
    }
  });

  // Le rôle est relu en base : un admin rétrogradé perd ses droits sans attendre l'expiration du jeton
  app.decorate('requireAdmin', async (request: FastifyRequest) => {
    await app.authenticate(request);
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { role: true },
    });
    if (user?.role !== 'admin') throw new HttpError(403, 'Accès réservé aux administrateurs');
  });
}
