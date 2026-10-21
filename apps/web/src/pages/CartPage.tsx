import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Price } from '../components/Price';
import { QuantityStepper } from '../components/QuantityStepper';
import { Card, focusRing, PageTitle } from '../components/ui';
import { useCart } from '../features/cart/CartContext';
import { useCartSync } from '../features/cart/useCartSync';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function CartPage() {
  const { t } = useTranslation();
  const cart = useCart();
  const syncing = useCartSync();
  const blocked = syncing || cart.items.some((item) => item.stock === 0);
  useDocumentTitle(t('cart.title'));

  if (cart.items.length === 0) {
    return (
      <>
        <PageTitle>{t('cart.title')}</PageTitle>
        <p className="text-gray-600 dark:text-gray-400">{t('cart.empty')}</p>
        <Link
          to="/catalogue"
          className={`mt-4 inline-block font-semibold text-indigo-600 underline dark:text-indigo-400 ${focusRing}`}
        >
          {t('cart.continue')}
        </Link>
      </>
    );
  }

  return (
    <>
      <PageTitle>{t('cart.title')}</PageTitle>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
          {cart.items.map((item) => (
            <li key={item.productId} className="flex flex-wrap items-center gap-4 p-4">
              <img
                src={item.imageUrl}
                alt=""
                width={96}
                height={72}
                className="h-18 w-24 rounded-lg bg-gray-100 object-cover dark:bg-gray-800"
              />
              <div className="min-w-40 flex-1">
                <Link
                  to={`/produits/${item.slug}`}
                  className={`font-semibold hover:text-indigo-600 ${focusRing}`}
                >
                  {item.name}
                </Link>
                <Price
                  cents={item.unitPriceCents}
                  className="block text-sm text-gray-600 dark:text-gray-400"
                />
                {item.stock === 0 && (
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {t('cart.unavailable')}
                  </p>
                )}
              </div>
              <QuantityStepper
                value={item.quantity}
                max={item.stock}
                onChange={(quantity) => cart.setQuantity(item.productId, quantity)}
                label={t('cart.quantityFor', { name: item.name })}
              />
              <Price
                cents={item.unitPriceCents * item.quantity}
                className="w-24 text-right font-semibold"
              />
              <button
                type="button"
                onClick={() => cart.remove(item.productId)}
                aria-label={t('cart.remove', { name: item.name })}
                className={`rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 ${focusRing}`}
              >
                <Trash2 aria-hidden="true" className="size-5" />
              </button>
            </li>
          ))}
        </ul>

        <Card className="h-fit space-y-3">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>{t('cart.subtotal')}</dt>
              <dd>
                <Price cents={cart.totalCents} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>{t('cart.shipping')}</dt>
              <dd className="text-emerald-700 dark:text-emerald-400">{t('cart.free')}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold dark:border-gray-800">
              <dt>{t('cart.total')}</dt>
              <dd>
                <Price cents={cart.totalCents} />
              </dd>
            </div>
          </dl>
          {blocked ? (
            <span
              aria-disabled="true"
              className="block cursor-not-allowed rounded-lg bg-indigo-400 px-4 py-3 text-center font-semibold text-white dark:bg-indigo-900"
            >
              {t('cart.checkout')}
            </span>
          ) : (
            <Link
              to="/commande"
              className={`block rounded-lg bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-700 ${focusRing}`}
            >
              {t('cart.checkout')}
            </Link>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('cart.priceNotice')}</p>
        </Card>
      </div>
    </>
  );
}
