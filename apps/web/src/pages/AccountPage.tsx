import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { Price } from '../components/Price';
import { ErrorMessage, focusRing, PageTitle, Spinner } from '../components/ui';
import { useMe, useOrders } from '../lib/queries';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function AccountPage() {
  const { t, i18n } = useTranslation();
  const { data: user } = useMe();
  const { data: orders, isPending, isError, refetch } = useOrders();
  useDocumentTitle(t('account.title'));

  return (
    <>
      <PageTitle>{t('account.hello', { name: user?.name ?? '' })}</PageTitle>
      <h2 className="mb-4 text-xl font-bold">{t('account.orders')}</h2>
      {isPending && <Spinner />}
      {isError && <ErrorMessage onRetry={() => void refetch()} />}
      {orders?.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400">{t('account.noOrders')}</p>
      )}
      {orders && orders.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <p className="font-semibold">{t('order.number', { id: order.id.slice(-8) })}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('order.date', {
                    date: new Date(order.createdAt).toLocaleDateString(i18n.language),
                  })}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
              <Price cents={order.totalCents} className="font-semibold" />
              <Link
                to={`/compte/commandes/${order.id}`}
                className={`text-sm font-semibold text-indigo-600 underline dark:text-indigo-400 ${focusRing}`}
              >
                {t('account.viewOrder')}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
