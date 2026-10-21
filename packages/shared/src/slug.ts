/** « Écran 27" 4K » → « ecran-27-4k » : minuscules, sans accents, mots séparés par des tirets. */
export const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
