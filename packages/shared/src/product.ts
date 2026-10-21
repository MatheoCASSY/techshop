import { z } from 'zod';

export const CATEGORY_SLUGS = [
  'laptops',
  'smartphones',
  'audio',
  'peripherals',
  'components',
  'accessories',
] as const;

export const categorySlugSchema = z.enum(CATEGORY_SLUGS);
export type CategorySlug = z.infer<typeof categorySlugSchema>;

/** Les prix sont toujours manipulés en centimes pour éviter les erreurs d'arrondi. */
export const priceCentsSchema = z.number().int().nonnegative();

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000),
  priceCents: priceCentsSchema,
  stock: z.number().int().nonnegative(),
  imageUrl: z.url(),
  category: categorySlugSchema,
  averageRating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative(),
});
export type Product = z.infer<typeof productSchema>;

export const PRODUCT_SORTS = ['relevance', 'price-asc', 'price-desc', 'newest', 'rating'] as const;

/** Paramètres de recherche du catalogue (query string → objet typé). */
export const productQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    category: categorySlugSchema.optional(),
    minPrice: z.coerce.number().int().nonnegative().optional(),
    maxPrice: z.coerce.number().int().nonnegative().optional(),
    sort: z.enum(PRODUCT_SORTS).default('relevance'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(12),
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    message: 'minPrice doit être inférieur ou égal à maxPrice',
    path: ['minPrice'],
  });
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const paginatedSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });
export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** Création / modification d'un produit dans le back-office. */
export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug invalide (minuscules, chiffres et tirets)')
    .max(140),
  description: z.string().trim().max(2000),
  priceCents: priceCentsSchema.max(10_000_000),
  stock: z.number().int().nonnegative().max(100_000),
  imageUrl: z.url({ protocol: /^https?$/ }),
  category: categorySlugSchema,
});
export type ProductInput = z.infer<typeof productInputSchema>;

export const categorySchema = z.object({
  slug: categorySlugSchema,
  name: z.string(),
  productCount: z.number().int(),
});
export type Category = z.infer<typeof categorySchema>;
