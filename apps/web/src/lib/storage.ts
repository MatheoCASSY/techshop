/**
 * Accès à localStorage tolérant aux erreurs : navigation privée, stockage plein ou bloqué.
 * Le site doit fonctionner même si rien ne peut être persisté.
 */
export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Pas de persistance possible : on continue en mémoire
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // idem
    }
  },
};
