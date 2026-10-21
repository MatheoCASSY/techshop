import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Titre d'onglet par page : repère indispensable pour les lecteurs d'écran à chaque navigation. */
export function useDocumentTitle(title?: string) {
  const { t } = useTranslation();
  const appName = t('common.appName');
  useEffect(() => {
    document.title = title ? `${title} · ${appName}` : appName;
  }, [title, appName]);
}
