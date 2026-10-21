import { formatPrice } from '@techshop/shared';
import { currentLanguage, LOCALES } from '../i18n';
import { useTranslation } from 'react-i18next';

export function useFormatPrice() {
  // Re-rendu au changement de langue grâce à useTranslation
  useTranslation();
  return (cents: number) => formatPrice(cents, LOCALES[currentLanguage()]);
}

export function Price({ cents, className }: { cents: number; className?: string }) {
  const format = useFormatPrice();
  return <span className={className}>{format(cents)}</span>;
}
