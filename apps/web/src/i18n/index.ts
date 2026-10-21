import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../lib/storage';
import en from './en';
import fr from './fr';

export const LANGUAGES = ['fr', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'techshop.lang';

const isLanguage = (value: unknown): value is Language => LANGUAGES.includes(value as Language);

function detectLanguage(): Language {
  const saved = storage.get(STORAGE_KEY);
  if (isLanguage(saved)) return saved;
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

/** Locale Intl correspondant à la langue (formats de prix et de dates). */
export const LOCALES: Record<Language, string> = { fr: 'fr-FR', en: 'en-GB' };

export function currentLanguage(): Language {
  return isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'fr';
}

export async function changeLanguage(language: Language) {
  storage.set(STORAGE_KEY, language);
  await i18n.changeLanguage(language);
}

// Garde l'attribut lang du document synchronisé (lecteurs d'écran, césure)
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: detectLanguage(),
  fallbackLng: 'fr',
  // React échappe déjà le contenu : pas de double échappement
  interpolation: { escapeValue: false },
});

export default i18n;
