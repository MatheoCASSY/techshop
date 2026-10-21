import { zodResolver } from '@hookform/resolvers/zod';
import { paymentSchema, shippingSchema } from '@techshop/shared';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';
import { z } from 'zod';
import { Price, useFormatPrice } from '../components/Price';
import { Button, Card, ErrorMessage, Field, Input, PageTitle } from '../components/ui';
import { useCart } from '../features/cart/CartContext';
import { useCartSync } from '../features/cart/useCartSync';
import { useCheckout, useMe } from '../lib/queries';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { useFieldError } from '../lib/validation';

const formSchema = z.object({ shipping: shippingSchema, payment: paymentSchema });
type FormInput = z.input<typeof formSchema>;

export function CheckoutPage() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const formatPrice = useFormatPrice();
  const navigate = useNavigate();
  const cart = useCart();
  const { data: user } = useMe();
  const checkout = useCheckout();
  const syncing = useCartSync();
  const outOfStock = cart.items.some((item) => item.stock === 0);
  useDocumentTitle(t('checkout.title'));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shipping: { name: user?.name ?? '', address: '', city: '', zip: '', country: 'France' },
      payment: { cardNumber: '', expiry: '', cvc: '' },
    },
  });

  // Panier vide ou article en rupture : retour au panier, qui explique quoi faire
  if (!checkout.isSuccess && (cart.items.length === 0 || outOfStock)) {
    return <Navigate to="/panier" replace />;
  }

  const onSubmit = handleSubmit((values) => {
    checkout.mutate(
      {
        items: cart.items.map(({ productId, quantity }) => ({ productId, quantity })),
        shipping: values.shipping,
        payment: values.payment,
      },
      {
        onSuccess: (order) => {
          cart.clear();
          void navigate(`/compte/commandes/${order.id}?confirmation=1`, { replace: true });
        },
      },
    );
  });

  const shippingFields = ['name', 'address', 'city', 'zip', 'country'] as const;
  const autoComplete = {
    name: 'name',
    address: 'street-address',
    city: 'address-level2',
    zip: 'postal-code',
    country: 'country-name',
  } as const;

  return (
    <>
      <PageTitle>{t('checkout.title')}</PageTitle>
      <form noValidate onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <Card>
            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-semibold">{t('checkout.shipping')}</legend>
              {shippingFields.map((field) => (
                <Field
                  key={field}
                  label={t(`checkout.${field}`)}
                  error={fieldError(errors.shipping?.[field])}
                >
                  {(props) => (
                    <Input
                      {...props}
                      {...register(`shipping.${field}`)}
                      autoComplete={autoComplete[field]}
                    />
                  )}
                </Field>
              ))}
            </fieldset>
          </Card>

          <Card>
            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-semibold">{t('checkout.payment')}</legend>
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                {t('checkout.fakePayment')}
              </p>
              <Field
                label={t('checkout.cardNumber')}
                error={fieldError(errors.payment?.cardNumber)}
              >
                {(props) => (
                  <Input
                    {...props}
                    {...register('payment.cardNumber')}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="4242 4242 4242 4242"
                  />
                )}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t('checkout.expiry')} error={fieldError(errors.payment?.expiry)}>
                  {(props) => (
                    <Input
                      {...props}
                      {...register('payment.expiry')}
                      autoComplete="off"
                      placeholder="12/30"
                    />
                  )}
                </Field>
                <Field label={t('checkout.cvc')} error={fieldError(errors.payment?.cvc)}>
                  {(props) => (
                    <Input
                      {...props}
                      {...register('payment.cvc')}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="123"
                    />
                  )}
                </Field>
              </div>
            </fieldset>
          </Card>
        </div>

        <Card className="h-fit space-y-4">
          <h2 className="text-lg font-semibold">{t('checkout.summary')}</h2>
          <ul className="space-y-2 text-sm">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-4">
                <span>
                  {item.quantity} × {item.name}
                </span>
                <Price cents={item.unitPriceCents * item.quantity} />
              </li>
            ))}
          </ul>
          <p className="flex justify-between border-t border-gray-200 pt-3 font-bold dark:border-gray-800">
            <span>{t('cart.total')}</span>
            <Price cents={cart.totalCents} />
          </p>
          {checkout.error && <ErrorMessage message={checkout.error.message} />}
          <Button type="submit" className="w-full" loading={checkout.isPending} disabled={syncing}>
            {checkout.isPending
              ? t('checkout.paying')
              : t('checkout.pay', { amount: formatPrice(cart.totalCents) })}
          </Button>
        </Card>
      </form>
    </>
  );
}
