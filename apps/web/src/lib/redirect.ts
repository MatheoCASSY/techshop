/**
 * Cible de redirection après connexion : uniquement un chemin interne,
 * pour empêcher une redirection ouverte (?redirect=https://site-malveillant).
 */
export function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  return value;
}
