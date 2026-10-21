import type { Prisma } from '@prisma/client';
import {
  type Category,
  type CategorySlug,
  type Paginated,
  type Product,
  type ProductQuery,
  productQuerySchema,
} from '@techshop/shared';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { notFound } from '../lib/errors.js';
import { toProduct } from '../lib/serializers.js';

const slugParamsSchema = z.object({ slug: z.string().min(1).max(140) });

const ORDER_BY: Record<ProductQuery['sort'], Prisma.ProductOrderByWithRelationInput[]> = {
  relevance: [{ reviewCount: 'desc' }, { name: 'asc' }],
  'price-asc': [{ priceCents: 'asc' }],
  'price-desc': [{ priceCents: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  rating: [{ ratingAvg: { sort: 'desc', nulls: 'last' } }, { reviewCount: 'desc' }],
};

export function buildProductWhere(query: ProductQuery): Prisma.ProductWhereInput {
  return {
    // LIKE de SQLite est insensible à la casse pour l'ASCII
    ...(query.q && {
      OR: [{ name: { contains: query.q } }, { description: { contains: query.q } }],
    }),
    ...(query.category && { category: { slug: query.category } }),
    ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
      priceCents: { gte: query.minPrice, lte: query.maxPrice },
    }),
  };
}

export const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get('/products', async (request): Promise<Paginated<Product>> => {
    const query = productQuerySchema.parse(request.query);
    const where = buildProductWhere(query);

    const [total, products] = await app.prisma.$transaction([
      app.prisma.product.count({ where }),
      app.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: ORDER_BY[query.sort],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: products.map(toProduct),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  });

  app.get('/products/:slug', async (request): Promise<Product> => {
    const { slug } = slugParamsSchema.parse(request.params);
    const product = await app.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product) throw notFound('Produit introuvable');
    return toProduct(product);
  });

  app.get('/categories', async (): Promise<Category[]> => {
    const categories = await app.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return categories.map((category) => ({
      slug: category.slug as CategorySlug,
      name: category.name,
      productCount: category._count.products,
    }));
  });
};
