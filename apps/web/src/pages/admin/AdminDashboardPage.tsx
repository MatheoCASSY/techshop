import { ORDER_STATUSES } from '@techshop/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { useFormatPrice } from '../../components/Price';
import { Card, ErrorMessage, focusRing, PageTitle, Spinner } from '../../components/ui';
import { useAdminStats } from '../../lib/adminQueries';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const formatPrice = useFormatPrice();
  const { data: stats, isPending, isError, refetch } = useAdminStats();
  useDocumentTitle(t('admin.dashboard'));

  if (isPending) return <Spinner />;
  if (isError) return <ErrorMessage onRetry={() => void refetch()} />;

  const number = (value: number) => value.toLocaleString(i18n.language);
  const kpis = [
    { label: t('admin.revenue'), value: formatPrice(stats.revenueCents) },
    { label: t('admin.orderCount'), value: number(stats.orderCount) },
    { label: t('admin.customerCount'), value: number(stats.customerCount) },
    { label: t('admin.productCount'), value: number(stats.productCount) },
  ];
  // Barres proportionnelles au statut le plus fréquent
  const maxByStatus = Math.max(1, ...Object.values(stats.ordersByStatus));

  return (
    <>
      <PageTitle>{t('admin.dashboard')}</PageTitle>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <dt className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{kpi.value}</dd>
          </Card>
        ))}
      </dl>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{t('admin.ordersByStatus')}</h2>
          <ul className="space-y-3">
            {ORDER_STATUSES.map((status) => {
              const count = stats.ordersByStatus[status];
              return (
                <li key={status} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3">
                  <OrderStatusBadge status={status} />
                  <span
                    aria-hidden="true"
                    className="h-2 rounded-full bg-gray-100 dark:bg-gray-800"
                  >
                    <span
                      className="block h-full rounded-full bg-indigo-500"
                      style={{ width: `${(count / maxByStatus) * 100}%` }}
                    />
                  </span>
                  <span className="text-right text-sm font-semibold tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">{t('admin.lowStock')}</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.noLowStock')}</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {stats.lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-4 py-2">
                  <Link
                    to={`/admin/produits/${product.id}`}
                    className={`text-sm hover:text-indigo-600 ${focusRing}`}
                  >
                    {product.name}
                  </Link>
                  <span
                    className={`text-sm font-semibold ${product.stock === 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}
                  >
                    {t('admin.stockLeft', { count: product.stock })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
