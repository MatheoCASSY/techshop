import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginInput, loginSchema, type RegisterInput, registerSchema } from '@techshop/shared';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { Button, Card, ErrorMessage, Field, focusRing, Input, PageTitle } from '../components/ui';
import { useLogin, useMe, useRegister } from '../lib/queries';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { safeRedirect } from '../lib/redirect';
import { useFieldError } from '../lib/validation';

function useRedirectTarget() {
  const [params] = useSearchParams();
  return safeRedirect(params.get('redirect'));
}

function AuthLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md">
      <PageTitle>{title}</PageTitle>
      <Card>{children}</Card>
    </div>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const navigate = useNavigate();
  const redirect = useRedirectTarget();
  const { data: user } = useMe();
  const login = useLogin();
  useDocumentTitle(t('auth.loginTitle'));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  if (user) return <Navigate to={redirect} replace />;

  return (
    <AuthLayout title={t('auth.loginTitle')}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((input) =>
          login.mutate(input, { onSuccess: () => void navigate(redirect, { replace: true }) }),
        )}
      >
        <Field label={t('auth.email')} error={fieldError(errors.email)}>
          {(props) => <Input {...props} {...register('email')} type="email" autoComplete="email" />}
        </Field>
        <Field label={t('auth.password')} error={fieldError(errors.password)}>
          {(props) => (
            <Input
              {...props}
              {...register('password')}
              type="password"
              autoComplete="current-password"
            />
          )}
        </Field>
        {login.error && <ErrorMessage message={login.error.message} />}
        <Button type="submit" className="w-full" loading={login.isPending}>
          {t('auth.submitLogin')}
        </Button>
      </form>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {t('auth.noAccount')}{' '}
        <Link
          to={`/inscription${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
          className={`font-semibold text-indigo-600 underline dark:text-indigo-400 ${focusRing}`}
        >
          {t('nav.register')}
        </Link>
      </p>
      <p className="mt-4 rounded-lg bg-gray-100 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        {t('auth.demo')}
      </p>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const navigate = useNavigate();
  const redirect = useRedirectTarget();
  const { data: user } = useMe();
  const registerUser = useRegister();
  useDocumentTitle(t('auth.registerTitle'));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  if (user) return <Navigate to={redirect} replace />;

  return (
    <AuthLayout title={t('auth.registerTitle')}>
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((input) =>
          registerUser.mutate(input, {
            onSuccess: () => void navigate(redirect, { replace: true }),
          }),
        )}
      >
        <Field label={t('auth.name')} error={fieldError(errors.name)}>
          {(props) => <Input {...props} {...register('name')} autoComplete="name" />}
        </Field>
        <Field label={t('auth.email')} error={fieldError(errors.email)}>
          {(props) => <Input {...props} {...register('email')} type="email" autoComplete="email" />}
        </Field>
        <Field
          label={t('auth.password')}
          hint={t('auth.passwordHint')}
          error={fieldError(errors.password)}
        >
          {(props) => (
            <Input
              {...props}
              {...register('password')}
              type="password"
              autoComplete="new-password"
            />
          )}
        </Field>
        {registerUser.error && <ErrorMessage message={registerUser.error.message} />}
        <Button type="submit" className="w-full" loading={registerUser.isPending}>
          {t('auth.submitRegister')}
        </Button>
      </form>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {t('auth.hasAccount')}{' '}
        <Link
          to="/connexion"
          className={`font-semibold text-indigo-600 underline dark:text-indigo-400 ${focusRing}`}
        >
          {t('nav.login')}
        </Link>
      </p>
    </AuthLayout>
  );
}
