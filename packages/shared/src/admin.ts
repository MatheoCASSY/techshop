import type { OrderStatus } from './order.js';
import type { Product } from './product.js';

/** Indicateurs du tableau de bord du back-office. */
export interface AdminStats {
  revenueCents: number;
  orderCount: number;
  customerCount: number;
  productCount: number;
  lowStock: Pick<Product, 'id' | 'name' | 'slug' | 'stock'>[];
  ordersByStatus: Record<OrderStatus, number>;
}

/** En dessous de ce stock, un produit est signalé dans le tableau de bord. */
export const LOW_STOCK_THRESHOLD = 5;
