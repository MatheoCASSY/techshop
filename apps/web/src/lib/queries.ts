import {
  type Paginated,
  type Category,
  type CheckoutInput,
  type LoginInput,
  type Order,
  type Product,
  type ProductQuery,
  type RegisterInput,
  type Review,
  type ReviewInput,
  type User,
} from '@techshop/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch, toQueryString } from './api';

// Clés de cache centralisées : une invalidation ne rate jamais une requête
export const queryKeys = {
  me: ['me'] as const,
  products: (query: Partial<ProductQuery>) => ['products', query] as const,
  product: (slug: string) => ['product', slug] as const,
  reviews: (slug: string) => ['reviews', slug] as const,
  categories: ['categories'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['order', id] as const,
};

// ---- Catalogue -------------------------------------------------------------

export const useProducts = (query: Partial<ProductQuery>) =>
  useQuery({
    queryKey: queryKeys.products(query),
    queryFn: ({ signal }) =>
      apiFetch<Paginated<Product>>(`/products${toQueryString(query)}`, { signal }),
    // Garde la page précédente affichée pendant le chargement de la suivante
    placeholderData: (previous) => previous,
  });

export const useProduct = (slug: string) =>
  useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: ({ signal }) => apiFetch<Product>(`/products/${encodeURIComponent(slug)}`, { signal }),
  });

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories,
    queryFn: ({ signal }) => apiFetch<Category[]>('/categories', { signal }),
    staleTime: 5 * 60_000,
  });

export const useReviews = (slug: string) =>
  useQuery({
    queryKey: queryKeys.reviews(slug),
    queryFn: ({ signal }) =>
      apiFetch<Review[]>(`/products/${encodeURIComponent(slug)}/reviews`, { signal }),
  });

export function useCreateReview(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) =>
      apiFetch<Review>(`/products/${encodeURIComponent(slug)}/reviews`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews(slug) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.product(slug) });
    },
  });
}

// ---- Session ---------------------------------------------------------------

/** Utilisateur connecté, ou null (un 401 n'est pas une erreur ici). */
export const useMe = () =>
  useQuery({
    queryKey: queryKeys.me,
    queryFn: async ({ signal }) => {
      try {
        return await apiFetch<User>('/auth/me', { signal });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: Infinity,
  });

function useSessionMutation<TInput>(path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => apiFetch<User>(path, { method: 'POST', body: input }),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

export const useLogin = () => useSessionMutation<LoginInput>('/auth/login');
export const useRegister = () => useSessionMutation<RegisterInput>('/auth/register');

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.me, null);
      // Rien de privé ne doit survivre à la déconnexion
      queryClient.removeQueries({ queryKey: queryKeys.orders });
      queryClient.removeQueries({ queryKey: ['order'] });
      queryClient.removeQueries({ queryKey: ['admin'] });
    },
  });
}

// ---- Commandes -------------------------------------------------------------

export const useOrders = () =>
  useQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ signal }) => apiFetch<Order[]>('/orders', { signal }),
  });

export const useOrder = (id: string) =>
  useQuery({
    queryKey: queryKeys.order(id),
    queryFn: ({ signal }) => apiFetch<Order>(`/orders/${encodeURIComponent(id)}`, { signal }),
  });

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) =>
      apiFetch<Order>('/orders', { method: 'POST', body: input }),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.order(order.id), order);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      // Le stock a changé
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}
