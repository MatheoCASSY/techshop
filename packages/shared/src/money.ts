/** Formate un montant en centimes selon la locale (ex. 129900 → « 1 299,00 € »). */
export function formatPrice(cents: number, locale = 'fr-FR', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}
