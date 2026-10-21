import { z } from 'zod';

export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

/** Transitions autorisées dans le back-office (une commande livrée ou annulée est figée). */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) =>
  ORDER_TRANSITIONS[from].includes(to);

export const MAX_QUANTITY_PER_ITEM = 10;

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;

export const shippingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(100),
  zip: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9 -]{3,10}$/, 'Code postal invalide'),
  country: z.string().trim().min(2).max(60),
});
export type ShippingInput = z.infer<typeof shippingSchema>;

/** Algorithme de Luhn : détecte les fautes de frappe dans un numéro de carte. */
export function isValidLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** Une date MM/AA est valable jusqu'à la fin du mois indiqué. */
export function isFutureExpiry(expiry: string, now = new Date()): boolean {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  return new Date(year, month, 1) > now;
}

/**
 * Paiement FACTICE : aucune donnée de carte n'est stockée ni transmise à un tiers.
 * Comme les cartes de test Stripe, 4000 0000 0000 0002 simule un refus.
 */
export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .refine(isValidLuhn, 'Numéro de carte invalide'),
  expiry: z.string().refine((v) => isFutureExpiry(v), 'Date d’expiration invalide'),
  cvc: z.string().regex(/^\d{3,4}$/, 'CVC invalide'),
});
export type PaymentInput = z.input<typeof paymentSchema>;

export const DECLINED_TEST_CARD = '4000000000000002';

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  shipping: shippingSchema,
  payment: paymentSchema,
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const orderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int(),
});

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  totalCents: z.number().int(),
  createdAt: z.string(),
  shipping: shippingSchema,
  items: z.array(orderItemSchema),
  customer: z.object({ name: z.string(), email: z.string() }).optional(),
});
export type Order = z.infer<typeof orderSchema>;

export const orderStatusUpdateSchema = z.object({ status: orderStatusSchema });
