import { zodResolver } from '@hookform/resolvers/zod';
import { LOW_STOCK_THRESHOLD, type ReviewInput, reviewInputSchema } from '@techshop/shared';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { Price } from '../components/Price';
import { QuantityStepper } from '../components/QuantityStepper';
import { Rating } from '../components/Rating';
import { Button, Card, ErrorMessage, Field, focusRing, Spinner } from '../components/ui';
import { useCart } from '../features/cart/CartContext';
import { ApiError } from '../lib/api';
import { useCreateReview, useMe, useProduct, useReviews } from '../lib/queries';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { useFieldError } from '../lib/validation';
import { NotFoundPage } from './NotFoundPage';

function ReviewForm({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const createReview = useCreateReview(slug);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewInputSchema),
    defaultValues: { rating: 5, comment: '' },
  });

  if (createReview.isSuccess) {
    return (
      <p role="status" className="font-medium text-emerald-700 dark:text-emerald-400">
        {t('reviews.thanks')}
      </p>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((input) => createReview.mutate(input, { onSuccess: () => reset() }))}
      className="space-y-4"
    >
      <h3 className="font-semibold">{t('reviews.write')}</h3>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          {t('reviews.rating')}
        </legend>
        <div className="flex flex-wrap gap-3">
          {[5, 4, 3, 2, 1].map((value) => (
            <label key={value} className="inline-flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                value={value}
                {...register('rating', { valueAsNumber: true })}
                className="accent-indigo-600"
              />
              {t('reviews.star', { count: value })}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label={t('reviews.comment')} error={fieldError(errors.comment)}>
        {(props) => (
          <textarea
            {...props}
            {...register('comment')}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-900"
          />
        )}
      </Field>
      {createReview.error && <ErrorMessage message={createReview.error.message} />}
      <Button type="submit" loading={createReview.isPending}>
        {t('reviews.submit')}
      </Button>
    </form>
  );
}

function Reviews({ slug }: { slug: string }) {
  const { t, i18n } = useTranslation();
  const { data: user } = useMe();
  const { data: reviews, isPending, isError } = useReviews(slug);

  return (
    <section aria-labelledby="reviews-title" className="mt-12 grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <h2 id="reviews-title" className="mb-4 text-xl font-bold">
          {t('reviews.title')}
        </h2>
        {isPending && <Spinner />}
        {isError && <ErrorMessage />}
        {reviews?.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">{t('reviews.empty')}</p>
        )}
        <ul className="space-y-4">
          {reviews?.map((review) => (
            <li key={review.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Rating value={review.rating} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {review.authorName} ·{' '}
                    <time dateTime={review.createdAt}>
                      {new Date(review.createdAt).toLocaleDateString(i18n.language)}
                    </time>
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
      <Card className="h-fit">
        {user ? (
          <ReviewForm slug={slug} />
        ) : (
          <p className="text-sm">
            <Link
              to="/connexion"
              className={`font-semibold text-indigo-600 underline ${focusRing}`}
            >
              {t('reviews.loginToReview')}
            </Link>
          </p>
        )}
      </Card>
    </section>
  );
}

export function ProductPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const { data: product, isPending, error, refetch } = useProduct(slug);
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  useDocumentTitle(product?.name);

  if (isPending) return <Spinner />;
  if (error instanceof ApiError && error.status === 404)
    return <NotFoundPage message={t('product.notFound')} />;
  if (error || !product) return <ErrorMessage onRetry={() => void refetch()} />;

  const inCart = cart.items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const available = Math.max(0, product.stock - inCart);

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-2">
        <img
          src={product.imageUrl}
          alt={product.name}
          width={640}
          height={480}
          className="aspect-[4/3] w-full rounded-2xl bg-gray-100 object-cover dark:bg-gray-800"
        />
        <div>
          <Link
            to={`/catalogue?category=${product.category}`}
            className={`text-sm font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400 ${focusRing}`}
          >
            {t(`categories.${product.category}`)}
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>
          <div className="mt-3">
            <Rating value={product.averageRating} count={product.reviewCount} />
          </div>
          <Price cents={product.priceCents} className="mt-6 block text-3xl font-extrabold" />
          <p className="mt-6 text-gray-700 dark:text-gray-300">{product.description}</p>

          <p className="mt-6 text-sm font-medium">
            {product.stock === 0 ? (
              <span className="text-red-600 dark:text-red-400">{t('product.outOfStock')}</span>
            ) : product.stock <= LOW_STOCK_THRESHOLD ? (
              <span className="text-amber-700 dark:text-amber-400">
                {t('product.lowStock', { count: product.stock })}
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400">{t('product.inStock')}</span>
            )}
          </p>

          {available > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <QuantityStepper
                value={Math.min(quantity, available)}
                max={available}
                onChange={setQuantity}
                label={t('product.quantity')}
              />
              <Button
                onClick={() => {
                  cart.add(product, Math.min(quantity, available));
                  setAdded(true);
                  setQuantity(1);
                }}
              >
                {t('product.addToCart')}
              </Button>
            </div>
          )}
          <p role="status" className="mt-3 h-5 text-sm text-emerald-700 dark:text-emerald-400">
            {added && (
              <span className="inline-flex items-center gap-1">
                <Check aria-hidden="true" className="size-4" />
                {t('product.added')}{' '}
                <Link to="/panier" className={`underline ${focusRing}`}>
                  {t('nav.cart')}
                </Link>
              </span>
            )}
          </p>
        </div>
      </div>
      <Reviews slug={product.slug} />
    </>
  );
}
