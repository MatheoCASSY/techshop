import { type Review, reviewInputSchema } from '@techshop/shared';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { conflict, isUniqueViolation, notFound } from '../lib/errors.js';
import { refreshProductRating } from '../lib/ratings.js';

const slugParamsSchema = z.object({ slug: z.string().min(1).max(140) });
const MAX_REVIEWS = 50;

export const reviewRoutes: FastifyPluginAsync = async (app) => {
  app.get('/products/:slug/reviews', async (request): Promise<Review[]> => {
    const { slug } = slugParamsSchema.parse(request.params);
    const product = await app.prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!product) throw notFound('Produit introuvable');

    const reviews = await app.prisma.review.findMany({
      where: { productId: product.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: MAX_REVIEWS,
    });
    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      authorName: review.user.name,
      createdAt: review.createdAt.toISOString(),
    }));
  });

  app.post(
    '/products/:slug/reviews',
    { preHandler: app.authenticate },
    async (request, reply): Promise<Review> => {
      const { slug } = slugParamsSchema.parse(request.params);
      const input = reviewInputSchema.parse(request.body);
      const product = await app.prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!product) throw notFound('Produit introuvable');

      try {
        const review = await app.prisma.$transaction(async (tx) => {
          const created = await tx.review.create({
            data: { ...input, productId: product.id, userId: request.user.sub },
            include: { user: { select: { name: true } } },
          });
          await refreshProductRating(tx, product.id);
          return created;
        });
        reply.code(201);
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          authorName: review.user.name,
          createdAt: review.createdAt.toISOString(),
        };
      } catch (error) {
        if (isUniqueViolation(error))
          throw conflict('Vous avez déjà donné votre avis sur ce produit');
        throw error;
      }
    },
  );
};
