import {
  CATEGORY_SLUGS,
  categorySlugSchema,
  PRODUCT_SORTS,
  type ProductQuery,
  productQuerySchema,
} from '@techshop/shared';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { ProductGrid } from '../components/ProductCard';
import { Button, ErrorMessage, Field, Input, PageTitle, Select, Spinner } from '../components/ui';
import { useProducts } from '../lib/queries';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const euros = (cents: number | undefined) => (cents === undefined ? '' : String(cents / 100));
const cents = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return value.trim() === '' || !Number.isFinite(parsed) ? undefined : Math.round(parsed * 100);
};

/** L'URL est la source de vérité des filtres : partageables, et le bouton « retour » fonctionne. */
function useCatalogQuery() {
  const [params, setParams] = useSearchParams();
  const parsed = productQuerySchema.safeParse(Object.fromEntries(params));
  const query: ProductQuery = parsed.success
    ? parsed.data
    : { sort: 'relevance', page: 1, pageSize: 12 };

  const update = (changes: Partial<ProductQuery>) => {
    const next = { ...query, page: 1, ...changes };
    const search = new URLSearchParams();
    if (next.q) search.set('q', next.q);
    if (next.category) search.set('category', next.category);
    if (next.minPrice !== undefined) search.set('minPrice', String(next.minPrice));
    if (next.maxPrice !== undefined) search.set('maxPrice', String(next.maxPrice));
    if (next.sort !== 'relevance') search.set('sort', next.sort);
    if (next.page > 1) search.set('page', String(next.page));
    setParams(search);
  };

  return { query, update };
}

export function CatalogPage() {
  const { t } = useTranslation();
  const { query, update } = useCatalogQuery();
  const { data, isPending, isError, refetch, isPlaceholderData } = useProducts(query);
  const [minPrice, setMinPrice] = useState(euros(query.minPrice));
  const [maxPrice, setMaxPrice] = useState(euros(query.maxPrice));
  useDocumentTitle(t('catalog.title'));

  const applyPrices = (event: FormEvent) => {
    event.preventDefault();
    update({ minPrice: cents(minPrice), maxPrice: cents(maxPrice) });
  };

  const reset = () => {
    setMinPrice('');
    setMaxPrice('');
    update({ q: undefined, category: undefined, minPrice: undefined, maxPrice: undefined });
  };

  return (
    <>
      <PageTitle>
        {query.q ? t('catalog.resultsFor', { q: query.q }) : t('catalog.title')}
      </PageTitle>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside aria-labelledby="filters-title" className="space-y-6">
          <h2 id="filters-title" className="text-lg font-semibold">
            {t('catalog.filters')}
          </h2>

          <Field label={t('catalog.category')}>
            {(props) => (
              <Select
                {...props}
                value={query.category ?? ''}
                onChange={(event) => {
                  const category = categorySlugSchema.safeParse(event.target.value);
                  update({ category: category.success ? category.data : undefined });
                }}
              >
                <option value="">{t('catalog.allCategories')}</option>
                {CATEGORY_SLUGS.map((slug) => (
                  <option key={slug} value={slug}>
                    {t(`categories.${slug}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <form onSubmit={applyPrices} className="space-y-3">
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('catalog.price')}
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('catalog.minPrice')}>
                  {(props) => (
                    <Input
                      {...props}
                      inputMode="decimal"
                      value={minPrice}
                      onChange={(event) => setMinPrice(event.target.value)}
                      placeholder="0"
                    />
                  )}
                </Field>
                <Field label={t('catalog.maxPrice')}>
                  {(props) => (
                    <Input
                      {...props}
                      inputMode="decimal"
                      value={maxPrice}
                      onChange={(event) => setMaxPrice(event.target.value)}
                      placeholder="5000"
                    />
                  )}
                </Field>
              </div>
            </fieldset>
            <div className="flex gap-2">
              <Button type="submit">{t('catalog.apply')}</Button>
              <Button variant="ghost" onClick={reset}>
                {t('catalog.reset')}
              </Button>
            </div>
          </form>
        </aside>

        <section aria-labelledby="results-count" aria-busy={isPlaceholderData}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <p
              id="results-count"
              aria-live="polite"
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              {data && t('catalog.results', { count: data.total })}
            </p>
            <div className="w-56">
              <Field label={t('catalog.sort')}>
                {(props) => (
                  <Select
                    {...props}
                    value={query.sort}
                    onChange={(event) =>
                      update({ sort: event.target.value as ProductQuery['sort'] })
                    }
                  >
                    {PRODUCT_SORTS.map((sort) => (
                      <option key={sort} value={sort}>
                        {t(`catalog.sorts.${sort}`)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </div>

          {isPending && <Spinner />}
          {isError && <ErrorMessage onRetry={() => void refetch()} />}
          {data && data.items.length === 0 && (
            <p className="py-12 text-center text-gray-500 dark:text-gray-400">
              {t('catalog.empty')}
            </p>
          )}
          {data && data.items.length > 0 && (
            <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
              <ProductGrid products={data.items} />
            </div>
          )}

          {data && data.totalPages > 1 && (
            <nav
              aria-label={t('catalog.pagination')}
              className="mt-8 flex items-center justify-center gap-4"
            >
              <Button
                variant="secondary"
                disabled={query.page <= 1}
                onClick={() => update({ page: query.page - 1 })}
              >
                {t('catalog.previous')}
              </Button>
              <span className="text-sm" aria-current="page">
                {t('catalog.page', { page: query.page, total: data.totalPages })}
              </span>
              <Button
                variant="secondary"
                disabled={query.page >= data.totalPages}
                onClick={() => update({ page: query.page + 1 })}
              >
                {t('catalog.next')}
              </Button>
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
