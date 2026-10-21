import type {
  Category,
  Order as DbOrder,
  OrderItem,
  Product as DbProduct,
  User,
} from '@prisma/client';
import type {
  CategorySlug,
  Order,
  OrderStatus,
  Product,
  Role,
  User as PublicUser,
} from '@techshop/shared';

// Les modèles Prisma ne sortent jamais tels quels : on contrôle exactement ce qui est exposé
// (pas de passwordHash, dates en ISO, champs regroupés).

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role as Role,
});

export const toProduct = (product: DbProduct & { category: Category }): Product => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  description: product.description,
  priceCents: product.priceCents,
  stock: product.stock,
  imageUrl: product.imageUrl,
  category: product.category.slug as CategorySlug,
  averageRating: product.ratingAvg === null ? null : Math.round(product.ratingAvg * 10) / 10,
  reviewCount: product.reviewCount,
});

type OrderWithItems = DbOrder & {
  items: (OrderItem & { product: DbProduct })[];
  user?: Pick<User, 'name' | 'email'>;
};

export const toOrder = (order: OrderWithItems): Order => ({
  id: order.id,
  status: order.status as OrderStatus,
  totalCents: order.totalCents,
  createdAt: order.createdAt.toISOString(),
  shipping: {
    name: order.shippingName,
    address: order.shippingAddress,
    city: order.shippingCity,
    zip: order.shippingZip,
    country: order.shippingCountry,
  },
  items: order.items.map((item) => ({
    productId: item.productId,
    name: item.product.name,
    slug: item.product.slug,
    imageUrl: item.product.imageUrl,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
  })),
  ...(order.user && { customer: { name: order.user.name, email: order.user.email } }),
});

export const orderInclude = { items: { include: { product: true } } } as const;
