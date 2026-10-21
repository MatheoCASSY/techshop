import 'i18next';
import type { Translations } from './fr';

// Clés de traduction typées : t('nav.cart') est vérifié à la compilation
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Translations };
  }
}
