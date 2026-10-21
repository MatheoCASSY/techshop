import type { AdminStats, Order, OrderStatus, Product, ProductInput } from '@techshop/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, toQueryString } from './api';

// Toutes les clés commencent par « admin » : la déconnexion les purge d'un coup
export const adminKeys = {
  stats: ['admin', 'stats'] as const,
  products: ['admin', 'products'] as const,
  orders: (status?: OrderStatus) => ['admin', 'orders', status ?? 'all'] as const,
};

export const useAdminStats = () =>
  useQuery({
    queryKey: adminKeys.stats,
    queryFn: ({ signal }) => apiFetch<AdminStats>('/admin/stats', { signal }),
  });

export const useAdminProducts = () =>
  useQuery({
    queryKey: adminKeys.products,
    queryFn: ({ signal }) => apiFetch<Product[]>('/admin/products', { signal }),
  });

/** Après une modification du catalogue, tout ce qui en dépend est rechargé. */
function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
    void queryClient.invalidateQueries({ queryKey: ['products'] });
    void queryClient.invalidateQueries({ queryKey: ['product'] });
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
  };
}

export function useSaveProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ProductInput }) =>
      id
        ? apiFetch<Product>(`/admin/products/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: input,
          })
        : apiFetch<Product>('/admin/products', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

export const useAdminOrders = (status?: OrderStatus) =>
  useQuery({
    queryKey: adminKeys.orders(status),
    queryFn: ({ signal }) =>
      apiFetch<Order[]>(`/admin/orders${toQueryString({ status })}`, { signal }),
  });

export function useUpdateOrderStatus() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiFetch<Order>(`/admin/orders/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: { status },
      }),
    // Une annulation remet du stock : le catalogue est aussi concerné
    onSuccess: invalidate,
  });
}
