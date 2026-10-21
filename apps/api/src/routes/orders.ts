import {
  type CheckoutInput,
  checkoutSchema,
  DECLINED_TEST_CARD,
  MAX_QUANTITY_PER_ITEM,
  type Order,
} from '@techshop/shared';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { badRequest, conflict, HttpError, notFound } from '../lib/errors.js';
import { orderInclude, toOrder } from '../lib/serializers.js';

const idParamsSchema = z.object({ id: z.string().min(1).max(40) });

/** Regroupe les lignes d'un même produit (un panier peut contenir des doublons). */
export function mergeItems(items: CheckoutInput['items']): Map<string, number> {
  const merged = new Map<string, number>();
  for (const { productId, quantity } of items) {
    const total = (merged.get(productId) ?? 0) + quantity;
    if (total > MAX_QUANTITY_PER_ITEM) {
      throw badRequest(`Quantité maximale de ${MAX_QUANTITY_PER_ITEM} par produit`);
    }
    merged.set(productId, total);
  }
  return merged;
}

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.post('/orders', async (request, reply): Promise<Order> => {
    const input = checkoutSchema.parse(request.body);
    const quantities = mergeItems(input.items);

    // Paiement FACTICE : on ne conserve aucune donnée de carte
    if (input.payment.cardNumber === DECLINED_TEST_CARD) {
      throw new HttpError(402, 'Paiement refusé par la banque (carte de test)');
    }

    const order = await app.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: [...quantities.keys()] } } });
      if (products.length !== quantities.size)
        throw badRequest('Un produit du panier n’existe plus');

      for (const product of products) {
        const quantity = quantities.get(product.id) ?? 0;
        // Décrément conditionnel atomique : deux commandes simultanées ne peuvent pas
        // faire passer le stock en négatif
        const { count } = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (count === 0) throw conflict(`Stock insuffisant pour « ${product.name} »`);
      }

      // Le prix vient toujours de la base, jamais du client
      const totalCents = products.reduce(
        (sum, product) => sum + product.priceCents * (quantities.get(product.id) ?? 0),
        0,
      );

      return tx.order.create({
        data: {
          userId: request.user.sub,
          status: 'paid',
          totalCents,
          shippingName: input.shipping.name,
          shippingAddress: input.shipping.address,
          shippingCity: input.shipping.city,
          shippingZip: input.shipping.zip,
          shippingCountry: input.shipping.country,
          items: {
            create: products.map((product) => ({
              productId: product.id,
              quantity: quantities.get(product.id) ?? 0,
              unitPriceCents: product.priceCents,
            })),
          },
        },
        include: orderInclude,
      });
    });

    reply.code(201);
    return toOrder(order);
  });

  app.get('/orders', async (request): Promise<Order[]> => {
    const orders = await app.prisma.order.findMany({
      where: { userId: request.user.sub },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrder);
  });

  app.get('/orders/:id', async (request): Promise<Order> => {
    const { id } = idParamsSchema.parse(request.params);
    // 404 (et non 403) pour la commande d'un autre client : on ne révèle pas qu'elle existe
    const order = await app.prisma.order.findFirst({
      where: { id, userId: request.user.sub },
      include: orderInclude,
    });
    if (!order) throw notFound('Commande introuvable');
    return toOrder(order);
  });
};
