import { zodResolver } from '@hookform/resolvers/zod';
import {
  CATEGORY_SLUGS,
  type Product,
  type ProductInput,
  productInputSchema,
  slugify,
} from '@techshop/shared';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  focusRing,
  Input,
  PageTitle,
  Select,
  Spinner,
} from '../../components/ui';
import { useAdminProducts, useSaveProduct } from '../../lib/adminQueries';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useFieldError } from '../../lib/validation';
import { NotFoundPage } from '../NotFoundPage';

// Le formulaire saisit des euros ; l'API attend des centimes
const formSchema = productInputSchema.omit({ priceCents: true }).extend({
  priceEuros: z.number().nonnegative().max(100_000),
});
type FormValues = z.infer<typeof formSchema>;

const toFormValues = (product?: Product): FormValues => ({
  name: product?.name ?? '',
  slug: product?.slug ?? '',
  description: product?.description ?? '',
  priceEuros: product ? product.priceCents / 100 : 0,
  stock: product?.stock ?? 0,
  imageUrl: product?.imageUrl ?? '',
  category: product?.category ?? 'accessories',
});

function ProductForm({ product }: { product?: Product }) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const navigate = useNavigate();
  const save = useSaveProduct();
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(product),
  });

  const onSubmit = handleSubmit(({ priceEuros, ...values }) => {
    const input: ProductInput = { ...values, priceCents: Math.round(priceEuros * 100) };
    save.mutate({ id: product?.id, input }, { onSuccess: () => void navigate('/admin/produits') });
  });

  return (
    <Card className="max-w-2xl">
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <Field label={t('admin.name')} error={fieldError(errors.name)}>
          {(props) => (
            <Input
              {...props}
              {...register('name', {
                // Slug généré automatiquement tant que l'admin ne l'a pas modifié lui-même
                onChange: (event: { target: { value: string } }) => {
                  if (!product && !dirtyFields.slug) {
                    setValue('slug', slugify(event.target.value));
                  }
                },
              })}
            />
          )}
        </Field>
        <Field label={t('admin.slug')} hint={t('admin.slugHint')} error={fieldError(errors.slug)}>
          {(props) => <Input {...props} {...register('slug')} />}
        </Field>
        <Field label={t('admin.description')} error={fieldError(errors.description)}>
          {(props) => (
            <textarea
              {...props}
              {...register('description')}
              rows={4}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-900"
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('admin.priceEuros')} error={fieldError(errors.priceEuros)}>
            {(props) => (
              <Input
                {...props}
                {...register('priceEuros', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min={0}
              />
            )}
          </Field>
          <Field label={t('admin.stock')} error={fieldError(errors.stock)}>
            {(props) => (
              <Input
                {...props}
                {...register('stock', { valueAsNumber: true })}
                type="number"
                min={0}
              />
            )}
          </Field>
          <Field label={t('admin.category')} error={fieldError(errors.category)}>
            {(props) => (
              <Select {...props} {...register('category')}>
                {CATEGORY_SLUGS.map((slug) => (
                  <option key={slug} value={slug}>
                    {t(`categories.${slug}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label={t('admin.imageUrl')} error={fieldError(errors.imageUrl)}>
          {(props) => (
            <Input
              {...props}
              {...register('imageUrl')}
              type="url"
              placeholder={`https://placehold.co/640x480/png?text=${encodeURIComponent(getValues('name') || 'Produit')}`}
            />
          )}
        </Field>
        {save.error && <ErrorMessage message={save.error.message} />}
        <div className="flex gap-3">
          <Button type="submit" loading={save.isPending}>
            {t('common.save')}
          </Button>
          <Link
            to="/admin/produits"
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 ${focusRing}`}
          >
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </Card>
  );
}

export function AdminProductFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isNew = id === undefined;
  const { data: products, isPending, isError, refetch } = useAdminProducts();
  const product = products?.find((p) => p.id === id);
  const title = isNew
    ? t('admin.newProduct')
    : t('admin.editProduct', { name: product?.name ?? '' });
  useDocumentTitle(title);

  if (!isNew && isPending) return <Spinner />;
  if (!isNew && isError) return <ErrorMessage onRetry={() => void refetch()} />;
  if (!isNew && !product) return <NotFoundPage message={t('product.notFound')} />;

  return (
    <>
      <PageTitle>{title}</PageTitle>
      {/* key : le formulaire repart des bonnes valeurs si on passe d'un produit à l'autre */}
      <ProductForm key={product?.id ?? 'new'} product={product} />
    </>
  );
}
