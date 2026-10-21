import type { Product } from '@techshop/shared';
import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApiError, apiFetch } from '../../lib/api';
import { queryKeys } from '../../lib/queries';
import { useCart } from './CartContext';

/**
 * Le panier ne stocke qu'un instantané : on le resynchronise avec le catalogue (par slug)
 * pour afficher les prix et stocks à jour, et retirer les produits qui n'existent plus.
 * Renvoie true tant que la synchronisation est en cours.
 */
export function useCartSync() {
  const { items, sync } = useCart();
  const slugs = [...new Set(items.map((item) => item.slug))].sort();

  const results = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: queryKeys.product(slug),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        apiFetch<Product>(`/products/${encodeURIComponent(slug)}`, { signal }),
      staleTime: 0,
    })),
  });

  const settled = results.every((result) => !result.isPending);
  const products = results.flatMap((result) => (result.data ? [result.data] : []));
  const missingSlugs = slugs.filter((_, i) => {
    const error = results[i]?.error;
    return error instanceof ApiError && error.status === 404;
  });
  // Clé stable décrivant les données reçues, pour ne déclencher l'effet qu'en cas de changement
  const signature = JSON.stringify([products, missingSlugs]);

  useEffect(() => {
    if (settled) sync(products, missingSlugs);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `signature` résume products/missingSlugs
  }, [settled, signature]);

  return !settled;
}
