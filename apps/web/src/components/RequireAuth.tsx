import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { useMe } from '../lib/queries';
import { ErrorMessage, Spinner } from './ui';

/**
 * Protège une page côté interface (confort d'usage uniquement : la vraie protection
 * est faite par l'API, qui vérifie la session et le rôle à chaque requête).
 */
export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { data: user, isPending, isError, refetch } = useMe();

  if (isPending) return <Spinner />;
  if (isError) return <ErrorMessage onRetry={() => void refetch()} />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/connexion?redirect=${redirect}`} replace />;
  }
  if (admin && user.role !== 'admin') return <ErrorMessage message={t('notFound.text')} />;
  return children;
}
