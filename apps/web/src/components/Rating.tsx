import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Étoiles décoratives : l'information est donnée en texte aux lecteurs d'écran. */
export function Rating({ value, count }: { value: number | null; count?: number }) {
  const { t, i18n } = useTranslation();

  if (value === null) {
    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">{t('product.noRating')}</span>
    );
  }

  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
      <span className="sr-only">
        {t('product.rating', { rating: value.toLocaleString(i18n.language) })}
      </span>
      <span aria-hidden="true" className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`size-4 ${star <= rounded ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
          />
        ))}
      </span>
      {count !== undefined && <span>({t('product.reviewCount', { count })})</span>}
    </span>
  );
}
