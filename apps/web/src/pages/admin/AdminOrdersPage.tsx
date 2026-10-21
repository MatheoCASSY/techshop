import {
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  type Order,
  type OrderStatus,
  orderStatusSchema,
} from '@techshop/shared';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { Price } from '../../components/Price';
import { ErrorMessage, Field, PageTitle, Select, Spinner } from '../../components/ui';
import { useAdminOrders, useUpdateOrderStatus } from '../../lib/adminQueries';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

function StatusControl({ order }: { order: Order }) {
  const { t } = useTranslation();
  const update = useUpdateOrderStatus();
  const transitions = ORDER_TRANSITIONS[order.status];
  const number = order.id.slice(-8);

  if (transitions.length === 0) {
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">{t('admin.noTransition')}</span>
    );
  }

  return (
    <div>
      <label htmlFor={`status-${order.id}`} className="sr-only">
        {t('admin.changeStatus', { id: number })}
      </label>
      {/* Seules les transitions autorisées par la machine à états sont proposées */}
      <Select
        id={`status-${order.id}`}
        value=""
        disabled={update.isPending}
        onChange={(event) => {
          const status = orderStatusSchema.safeParse(event.target.value);
          if (status.success) update.mutate({ id: order.id, status: status.data });
        }}
        className="w-40"
      >
        <option value="" disabled>
          {t(`order.status.${order.status}`)} →
        </option>
        {transitions.map((status) => (
          <option key={status} value={status}>
            {t(`order.status.${status}`)}
          </option>
        ))}
      </Select>
      {update.error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {update.error.message}
        </p>
      )}
    </div>
  );
}

export function AdminOrdersPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const parsed = orderStatusSchema.safeParse(params.get('status'));
  const status: OrderStatus | undefined = parsed.success ? parsed.data : undefined;
  const { data: orders, isPending, isError, refetch } = useAdminOrders(status);
  useDocumentTitle(t('admin.orders'));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageTitle>{t('admin.orders')}</PageTitle>
        <div className="w-56">
          <Field label={t('admin.status')}>
            {(props) => (
              <Select
                {...props}
                value={status ?? ''}
                onChange={(event) =>
                  setParams(event.target.value ? { status: event.target.value } : {})
                }
              >
                <option value="">{t('admin.allStatuses')}</option>
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {t(`order.status.${value}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </div>

      {isPending && <Spinner />}
      {isError && <ErrorMessage onRetry={() => void refetch()} />}
      {orders?.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">{t('admin.noOrders')}</p>
      )}

      {orders && orders.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:text-gray-400 dark:border-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t('admin.number')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('admin.date')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('admin.customer')}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t('admin.total')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('admin.status')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('admin.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {orders.map((order) => (
                <tr key={order.id}>
                  <th scope="row" className="px-4 py-3 font-mono text-xs">
                    {order.id.slice(-8)}
                  </th>
                  <td className="px-4 py-3">
                    {new Date(order.createdAt).toLocaleDateString(i18n.language)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{order.customer?.name}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {order.customer?.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <Price cents={order.totalCents} />
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusControl order={order} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
