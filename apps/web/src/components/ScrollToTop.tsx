import { useEffect } from 'react';
import { useLocation } from 'react-router';

/** À chaque changement de page : retour en haut et focus sur le contenu (lecteurs d'écran). */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}
