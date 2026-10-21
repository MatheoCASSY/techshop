import { MAX_QUANTITY_PER_ITEM, type Product } from '@techshop/shared';

/** Ligne de panier : on garde un instantané du produit pour l'affichage. */
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  unitPriceCents: number;
  stock: number;
  quantity: number;
}

export type CartAction =
  | { type: 'add'; product: Product; quantity: number }
  | { type: 'setQuantity'; productId: string; quantity: number }
  | { type: 'remove'; productId: string }
  | { type: 'replace'; items: CartItem[] }
  | { type: 'sync'; products: Product[]; missingSlugs: string[] }
  | { type: 'clear' };

/** Met les lignes à jour avec les données fraîches du catalogue (prix, stock, identifiant). */
function syncItems(items: CartItem[], products: Product[], missingSlugs: string[]): CartItem[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  let changed = false;
  const next = items.flatMap((item) => {
    if (missingSlugs.includes(item.slug)) {
      changed = true;
      return [];
    }
    const fresh = bySlug.get(item.slug);
    if (!fresh) return [item];
    const updated: CartItem = {
      ...item,
      productId: fresh.id,
      name: fresh.name,
      imageUrl: fresh.imageUrl,
      unitPriceCents: fresh.priceCents,
      stock: fresh.stock,
      quantity: fresh.stock === 0 ? item.quantity : clampQuantity(item.quantity, fresh.stock),
    };
    const same = (Object.keys(updated) as (keyof CartItem)[]).every((k) => updated[k] === item[k]);
    if (!same) changed = true;
    return [same ? item : updated];
  });
  // Même référence si rien n'a changé : évite des rendus (et une boucle d'effets) inutiles
  return changed ? next : items;
}

/** Quantité autorisée : au moins 1, au plus la limite par produit et le stock connu. */
export const clampQuantity = (quantity: number, stock: number) =>
  Math.max(1, Math.min(Math.floor(quantity), MAX_QUANTITY_PER_ITEM, Math.max(stock, 1)));

export function cartReducer(items: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'add': {
      const { product } = action;
      const existing = items.find((item) => item.productId === product.id);
      if (existing) {
        return items.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                stock: product.stock,
                unitPriceCents: product.priceCents,
                quantity: clampQuantity(item.quantity + action.quantity, product.stock),
              }
            : item,
        );
      }
      return [
        ...items,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.imageUrl,
          unitPriceCents: product.priceCents,
          stock: product.stock,
          quantity: clampQuantity(action.quantity, product.stock),
        },
      ];
    }
    case 'setQuantity':
      return items.map((item) =>
        item.productId === action.productId
          ? { ...item, quantity: clampQuantity(action.quantity, item.stock) }
          : item,
      );
    case 'remove':
      return items.filter((item) => item.productId !== action.productId);
    case 'replace':
      return action.items;
    case 'sync':
      return syncItems(items, action.products, action.missingSlugs);
    case 'clear':
      return [];
  }
}

export const cartTotalCents = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

export const cartCount = (items: CartItem[]) => items.reduce((sum, item) => sum + item.quantity, 0);

/** Relit un panier sauvegardé en ignorant toute donnée corrompue ou modifiée à la main. */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is CartItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.productId === 'string' &&
        typeof item.slug === 'string' &&
        typeof item.name === 'string' &&
        typeof item.imageUrl === 'string' &&
        Number.isInteger(item.unitPriceCents) &&
        Number.isInteger(item.stock) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}
