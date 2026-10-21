import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { Price } from '../components/Price';
import { Card, ErrorMessage, focusRing, PageTitle, Spinner } from '../components/ui';
import { ApiError } from '../lib/api';
import { useOrder } from '../lib/queries';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function OrderPage() {
  const { t, i18n } = useTranslation();
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { data: order, isPending, error, refetch } = useOrder(id);
  const number = id.slice(-8);
  useDocumentTitle(t('order.number', { id: number }));

  if (isPending) return <Spinner />;
  if (error instanceof ApiError && error.status === 404) {
    return <ErrorMessage message={t('order.notFound')} />;
  }
  if (error || !order) return <ErrorMessage onRetry={() => void refetch()} />;

  return (
    <>
      {params.has('confirmation') && (
        <div
          role="status"
          className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        >
          <CheckCircle2 aria-hidden="true" className="size-6" />
          {t('order.confirmed')}
        </div>
      )}
      <PageTitle>{t('order.number', { id: number })}</PageTitle>
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>
          {t('order.date', { date: new Date(order.createdAt).toLocaleString(i18n.language) })}
        </span>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{t('order.items')}</h2>
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-4 py-3">
                <Link
                  to={`/produits/${item.slug}`}
                  className={`hover:text-indigo-600 ${focusRing}`}
                >
                  {item.quantity} × {item.name}
                </Link>
                <Price cents={item.unitPriceCents * item.quantity} />
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-gray-200 pt-4 font-bold dark:border-gray-800">
            <span>{t('cart.total')}</span>
            <Price cents={order.totalCents} />
          </p>
        </Card>
        <Card className="h-fit">
          <h2 className="mb-2 text-lg font-semibold">{t('order.shippingTo')}</h2>
          <address className="text-sm not-italic text-gray-700 dark:text-gray-300">
            {order.shipping.name}
            <br />
            {order.shipping.address}
            <br />
            {order.shipping.zip} {order.shipping.city}
            <br />
            {order.shipping.country}
          </address>
        </Card>
      </div>
    </>
  );
}
