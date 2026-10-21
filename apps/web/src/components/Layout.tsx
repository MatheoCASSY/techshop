import { Monitor, Moon, Search, ShoppingCart, Sun, User } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useNavigate, useSearchParams } from 'react-router';
import { useCart } from '../features/cart/CartContext';
import { type Theme, THEMES, useTheme } from '../features/theme/ThemeContext';
import { changeLanguage, currentLanguage, type Language, LANGUAGES } from '../i18n';
import { useLogout, useMe } from '../lib/queries';
import { cx, focusRing } from './ui';

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor } satisfies Record<Theme, unknown>;

function SearchForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    void navigate(q ? `/catalogue?q=${encodeURIComponent(q)}` : '/catalogue');
  };

  return (
    <form role="search" onSubmit={onSubmit} className="relative w-full sm:max-w-xs">
      <label htmlFor="site-search" className="sr-only">
        {t('nav.search')}
      </label>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('nav.searchPlaceholder')}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-900"
      />
      <button
        type="submit"
        aria-label={t('nav.search')}
        className={`absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 ${focusRing}`}
      >
        <Search aria-hidden="true" className="size-4" />
      </button>
    </form>
  );
}

function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? 'system';
  const Icon = THEME_ICONS[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={`rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 ${focusRing}`}
      aria-label={`${t('theme.toggle')} (${t(`theme.${theme}`)})`}
      title={t(`theme.${theme}`)}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}

function LanguageSwitcher() {
  const { t } = useTranslation();
  return (
    <div>
      <label htmlFor="language" className="sr-only">
        {t('language.label')}
      </label>
      <select
        id="language"
        value={currentLanguage()}
        onChange={(event) => void changeLanguage(event.target.value as Language)}
        className={`rounded-lg border-0 bg-transparent py-1.5 text-sm font-medium text-gray-600 dark:bg-gray-950 dark:text-gray-300 ${focusRing}`}
      >
        {LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {language.toUpperCase()} · {t(`language.${language}`)}
          </option>
        ))}
      </select>
    </div>
  );
}

function AccountLinks() {
  const { t } = useTranslation();
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const link = `rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 ${focusRing}`;

  if (!user) {
    return (
      <Link to="/connexion" className={cx(link, 'inline-flex items-center gap-1.5')}>
        <User aria-hidden="true" className="size-4" />
        {t('nav.login')}
      </Link>
    );
  }

  return (
    <>
      {user.role === 'admin' && (
        <NavLink to="/admin" className={link}>
          {t('nav.admin')}
        </NavLink>
      )}
      <NavLink to="/compte" className={cx(link, 'inline-flex items-center gap-1.5')}>
        <User aria-hidden="true" className="size-4" />
        {t('nav.account')}
      </NavLink>
      <button
        type="button"
        className={link}
        onClick={() => logout.mutate(undefined, { onSuccess: () => void navigate('/') })}
      >
        {t('nav.logout')}
      </button>
    </>
  );
}

function Header() {
  const { t } = useTranslation();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link
          to="/"
          className={`rounded text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 ${focusRing}`}
        >
          {t('common.appName')}
        </Link>

        <nav aria-label={t('nav.mainMenu')}>
          <NavLink
            to="/catalogue"
            className={({ isActive }) =>
              cx(
                'rounded-lg px-3 py-2 text-sm font-medium',
                focusRing,
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-700 hover:text-indigo-600 dark:text-gray-200',
              )
            }
          >
            {t('nav.catalog')}
          </NavLink>
        </nav>

        <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <SearchForm />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <AccountLinks />
          <Link
            to="/panier"
            aria-label={t('nav.cartCount', { count })}
            className={`relative rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 ${focusRing}`}
          >
            <ShoppingCart aria-hidden="true" className="size-5" />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white"
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Layout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('common.skipToContent')}
      </a>
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 focus:outline-none"
      >
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
        <p className="mx-auto max-w-3xl px-4">{t('footer.note')}</p>
      </footer>
    </div>
  );
}
