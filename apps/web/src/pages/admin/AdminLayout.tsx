import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router';
import { cx, focusRing } from '../../components/ui';

export function AdminLayout() {
  const { t } = useTranslation();
  const link = ({ isActive }: { isActive: boolean }) =>
    cx(
      'rounded-lg px-3 py-2 text-sm font-medium',
      focusRing,
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
    );

  return (
    <>
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
        {t('admin.title')}
      </p>
      <nav aria-label={t('admin.nav')} className="mb-8 flex flex-wrap gap-2">
        <NavLink to="/admin" end className={link}>
          {t('admin.dashboard')}
        </NavLink>
        <NavLink to="/admin/produits" className={link}>
          {t('admin.products')}
        </NavLink>
        <NavLink to="/admin/commandes" className={link}>
          {t('admin.orders')}
        </NavLink>
      </nav>
      <Outlet />
    </>
  );
}
