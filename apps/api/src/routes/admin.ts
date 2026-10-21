import {
  type AdminStats,
  canTransition,
  LOW_STOCK_THRESHOLD,
  type Order,
  orderStatusSchema,
  orderStatusUpdateSchema,
  type OrderStatus,
  type Product,
  productInputSchema,
  type ProductInput,
} from '@techshop/shared';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { badRequest, conflict, isUniqueViolation, notFound } from '../lib/errors.js';
import { orderInclude, toOrder, toProduct } from '../lib/serializers.js';

const idParamsSchema = z.object({ id: z.string().min(1).max(40) });
const ordersQuerySchema = z.object({ status: orderStatusSchema.optional() });

// Statuts qui comptent dans le chiffre d'affaires
const REVENUE_STATUSES: OrderStatus[] = ['paid', 'shipped', 'delivered'];

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // Toutes les routes de ce plugin exigent le rôle admin
  app.addHook('preHandler', app.requireAdmin);

  async function toProductData(input: ProductInput) {
    const category = await app.prisma.category.findUnique({ where: { slug: input.category } });
    if (!category) throw badRequest('Catégorie inconnue');
    const { category: _slug, ...fields } = input;
    return { ...fields, categoryId: category.id };
  }

  const rethrowSlugConflict = (error: unknown): never => {
    if (isUniqueViolation(error)) throw conflict('Ce slug est déjà utilisé par un autre produit');
    throw error;
  };

  app.get('/admin/stats', async (): Promise<AdminStats> => {
    const [revenue, orderCount, customerCount, productCount, lowStock, byStatus] =
      await app.prisma.$transaction([
        app.prisma.order.aggregate({
          where: { status: { in: REVENUE_STATUSES } },
          _sum: { totalCents: true },
        }),
        app.prisma.order.count(),
        app.prisma.user.count({ where: { role: 'customer' } }),
        app.prisma.product.count(),
        app.prisma.product.findMany({
          where: { stock: { lt: LOW_STOCK_THRESHOLD } },
          select: { id: true, name: true, slug: true, stock: true },
          orderBy: { stock: 'asc' },
        }),
        app.prisma.order.groupBy({ by: ['status'], _count: true, orderBy: { status: 'asc' } }),
      ]);

    const ordersByStatus = Object.fromEntries(
      orderStatusSchema.options.map((status) => [status, 0]),
    ) as Record<OrderStatus, number>;
    for (const row of byStatus) {
      const status = orderStatusSchema.safeParse(row.status);
      if (status.success) ordersByStatus[status.data] = row._count;
    }

    return {
      revenueCents: revenue._sum.totalCents ?? 0,
      orderCount,
      customerCount,
      productCount,
      lowStock,
      ordersByStatus,
    };
  });

  app.get('/admin/products', async (): Promise<Product[]> => {
    const products = await app.prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    return products.map(toProduct);
  });

  app.post('/admin/products', async (request, reply): Promise<Product> => {
    const data = await toProductData(productInputSchema.parse(request.body));
    const product = await app.prisma.product
      .create({ data, include: { category: true } })
      .catch(rethrowSlugConflict);
    reply.code(201);
    return toProduct(product);
  });

  app.put('/admin/products/:id', async (request): Promise<Product> => {
    const { id } = idParamsSchema.parse(request.params);
    const data = await toProductData(productInputSchema.parse(request.body));
    const existing = await app.prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw notFound('Produit introuvable');
    const product = await app.prisma.product
      .update({ where: { id }, data, include: { category: true } })
      .catch(rethrowSlugConflict);
    return toProduct(product);
  });

  app.delete('/admin/products/:id', async (request, reply) => {
    const { id } = idParamsSchema.parse(request.params);
    const product = await app.prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!product) throw notFound('Produit introuvable');
    // On conserve l'historique des commandes : un produit déjà vendu ne se supprime pas
    if (product._count.orderItems > 0) {
      throw conflict('Ce produit figure dans des commandes : passez plutôt son stock à 0');
    }
    await app.prisma.product.delete({ where: { id } });
    return reply.code(204).send();
  });

  app.get('/admin/orders', async (request): Promise<Order[]> => {
    const { status } = ordersQuerySchema.parse(request.query);
    const orders = await app.prisma.order.findMany({
      where: status ? { status } : {},
      include: { ...orderInclude, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toOrder);
  });

  app.patch('/admin/orders/:id/status', async (request): Promise<Order> => {
    const { id } = idParamsSchema.parse(request.params);
    const { status } = orderStatusUpdateSchema.parse(request.body);

    const order = await app.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw notFound('Commande introuvable');

      const from = orderStatusSchema.parse(current.status);
      if (!canTransition(from, status)) {
        throw conflict(`Transition impossible : ${from} → ${status}`);
      }
      // Une commande annulée remet ses articles en stock
      if (status === 'cancelled') {
        for (const item of current.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      return tx.order.update({
        where: { id },
        data: { status },
        include: { ...orderInclude, user: { select: { name: true, email: true } } },
      });
    });

    return toOrder(order);
  });
};
