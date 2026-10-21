import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Price } from '../../components/Price';
import { Button, ErrorMessage, focusRing, PageTitle, Spinner } from '../../components/ui';
import { useAdminProducts, useDeleteProduct } from '../../lib/adminQueries';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export function AdminProductsPage() {
  const { t } = useTranslation();
  const { data: products, isPending, isError, refetch } = useAdminProducts();
  const deleteProduct = useDeleteProduct();
  // Suppression en deux temps plutôt qu'une boîte de dialogue bloquante
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  useDocumentTitle(t('admin.products'));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PageTitle>{t('admin.products')}</PageTitle>
        <Link
          to="/admin/produits/nouveau"
          className={`inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 ${focusRing}`}
        >
          <Plus aria-hidden="true" className="size-4" />
          {t('admin.newProduct')}
        </Link>
      </div>

      <div role="status" aria-live="polite">
        {deleteProduct.isSuccess && (
          <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-400">
            {t('admin.deleted')}
          </p>
        )}
      </div>
      {deleteProduct.error && <ErrorMessage message={deleteProduct.error.message} />}
      {isPending && <Spinner />}
      {isError && <ErrorMessage onRetry={() => void refetch()} />}

      {products && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:text-gray-400 dark:border-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t('admin.name')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('admin.category')}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t('admin.price')}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t('admin.stock')}
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  {t('admin.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {products.map((product) => (
                <tr key={product.id}>
                  <th scope="row" className="px-4 py-3 font-medium">
                    {product.name}
                  </th>
                  <td className="px-4 py-3">{t(`categories.${product.category}`)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <Price cents={product.priceCents} />
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${product.stock === 0 ? 'font-semibold text-red-600 dark:text-red-400' : ''}`}
                  >
                    {product.stock}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/produits/${product.id}`}
                        aria-label={`${t('common.edit')} ${product.name}`}
                        className={`rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${focusRing}`}
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </Link>
                      {confirmingId === product.id ? (
                        <>
                          <Button
                            variant="danger"
                            loading={deleteProduct.isPending}
                            onClick={() =>
                              deleteProduct.mutate(product.id, {
                                onSettled: () => setConfirmingId(null),
                              })
                            }
                          >
                            {t('admin.confirmDelete')}
                          </Button>
                          <Button variant="ghost" onClick={() => setConfirmingId(null)}>
                            {t('common.cancel')}
                          </Button>
                        </>
                      ) : (
                        <button
                          type="button"
                          aria-label={`${t('common.delete')} ${product.name}`}
                          onClick={() => {
                            deleteProduct.reset();
                            setConfirmingId(product.id);
                          }}
                          className={`rounded-lg p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-950 ${focusRing}`}
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                      )}
                    </div>
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
