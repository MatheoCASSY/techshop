import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { focusRing } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function NotFoundPage({ message }: { message?: string }) {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.title'));

  return (
    <div className="py-20 text-center">
      <p className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t('notFound.title')}</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">{message ?? t('notFound.text')}</p>
      <Link
        to="/"
        className={`mt-6 inline-block font-semibold text-indigo-600 underline dark:text-indigo-400 ${focusRing}`}
      >
        {t('notFound.home')}
      </Link>
    </div>
  );
}
