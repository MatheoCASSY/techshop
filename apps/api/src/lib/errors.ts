import { Prisma } from '@prisma/client';

/** Erreur métier avec un code HTTP : le gestionnaire d'erreurs renvoie son message au client. */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound = (message = 'Ressource introuvable') => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
export const badRequest = (message: string) => new HttpError(400, message);

/** Violation de contrainte d'unicité Prisma (ex. email ou slug déjà utilisé). */
export const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
