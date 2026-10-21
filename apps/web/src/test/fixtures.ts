import type { Paginated, Product } from '@techshop/shared';

export const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  slug: 'ultrabook-air-14',
  name: 'UltraBook Air 14',
  description: 'Ultraportable 14 pouces',
  priceCents: 109_900,
  stock: 10,
  imageUrl: 'https://picsum.photos/seed/test/640/480',
  category: 'laptops',
  averageRating: 4.5,
  reviewCount: 2,
  ...overrides,
});

export const page = (items: Product[]): Paginated<Product> => ({
  items,
  page: 1,
  pageSize: 12,
  total: items.length,
  totalPages: 1,
});
