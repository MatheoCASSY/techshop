import { CATEGORY_SLUGS } from '@techshop/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ProductGrid } from '../components/ProductCard';
import { ErrorMessage, focusRing, Spinner } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { useProducts } from '../lib/queries';

function ProductSection({ title, sort }: { title: string; sort: 'rating' | 'newest' }) {
  const { data, isPending, isError, refetch } = useProducts({ sort, pageSize: 4 });
  return (
    <section aria-labelledby={`home-${sort}`} className="mt-12">
      <h2 id={`home-${sort}`} className="mb-4 text-xl font-bold">
        {title}
      </h2>
      {isPending && <Spinner />}
      {isError && <ErrorMessage onRetry={() => void refetch()} />}
      {data && <ProductGrid products={data.items} />}
    </section>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  useDocumentTitle();

  return (
    <>
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-14 text-white sm:px-12">
        <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          {t('home.title')}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-indigo-100">{t('home.subtitle')}</p>
        <Link
          to="/catalogue"
          className={`mt-8 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-50 ${focusRing} focus-visible:outline-white`}
        >
          {t('home.cta')}
        </Link>
      </section>

      <section aria-labelledby="home-categories" className="mt-12">
        <h2 id="home-categories" className="mb-4 text-xl font-bold">
          {t('home.categories')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORY_SLUGS.map((slug) => (
            <li key={slug}>
              <Link
                to={`/catalogue?category=${slug}`}
                className={`block rounded-xl border border-gray-200 bg-white p-4 text-center text-sm font-semibold hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-800 dark:bg-gray-900 dark:hover:text-indigo-400 ${focusRing}`}
              >
                {t(`categories.${slug}`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ProductSection title={t('home.topRated')} sort="rating" />
      <ProductSection title={t('home.newest')} sort="newest" />
    </>
  );
}
