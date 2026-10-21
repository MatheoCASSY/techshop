import type { Product } from '@techshop/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Price } from './Price';
import { Rating } from './Rating';
import { focusRing } from './ui';

export function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation();

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <img
        src={product.imageUrl}
        alt=""
        width={640}
        height={480}
        loading="lazy"
        className="aspect-[4/3] w-full bg-gray-100 object-cover dark:bg-gray-800"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          {t(`categories.${product.category}`)}
        </p>
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {/* Le lien couvre toute la carte (pseudo-élément) tout en gardant un seul lien accessible */}
          <Link
            to={`/produits/${product.slug}`}
            className={`rounded after:absolute after:inset-0 ${focusRing}`}
          >
            {product.name}
          </Link>
        </h3>
        <Rating value={product.averageRating} count={product.reviewCount} />
        <div className="mt-auto flex items-center justify-between pt-2">
          <Price
            cents={product.priceCents}
            className="text-lg font-bold text-gray-900 dark:text-white"
          />
          {product.stock === 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {t('product.outOfStock')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="flex">
          <div className="w-full">
            <ProductCard product={product} />
          </div>
        </li>
      ))}
    </ul>
  );
}
