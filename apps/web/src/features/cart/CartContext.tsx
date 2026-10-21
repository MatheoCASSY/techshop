import type { Product } from '@techshop/shared';
import { createContext, type ReactNode, use, useEffect, useMemo, useReducer } from 'react';
import { storage } from '../../lib/storage';
import { type CartItem, cartCount, cartReducer, cartTotalCents, parseStoredCart } from './cart';

const STORAGE_KEY = 'techshop.cart';

interface CartContextValue {
  items: CartItem[];
  count: number;
  totalCents: number;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  sync: (products: Product[], missingSlugs: string[]) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, null, () =>
    parseStoredCart(storage.get(STORAGE_KEY)),
  );

  // Panier persistant : il survit au rechargement de la page
  useEffect(() => {
    storage.set(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Synchronise les onglets ouverts sur la boutique
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        dispatch({ type: 'replace', items: parseStoredCart(event.newValue) });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      totalCents: cartTotalCents(items),
      add: (product, quantity = 1) => dispatch({ type: 'add', product, quantity }),
      setQuantity: (productId, quantity) => dispatch({ type: 'setQuantity', productId, quantity }),
      remove: (productId) => dispatch({ type: 'remove', productId }),
      sync: (products, missingSlugs) => dispatch({ type: 'sync', products, missingSlugs }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [items],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const context = use(CartContext);
  if (!context) throw new Error('useCart doit être utilisé dans <CartProvider>');
  return context;
}
