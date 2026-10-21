import type { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const KNOWN_CODES = ['invalid_format', 'too_small', 'too_big', 'invalid_type', 'custom'] as const;
type KnownCode = (typeof KNOWN_CODES)[number];

/**
 * Traduit une erreur de validation Zod (code de l'issue) dans la langue de l'interface :
 * les schémas partagés restent la source de vérité, seuls les messages sont localisés.
 */
export function useFieldError() {
  const { t } = useTranslation();
  return (error: FieldError | undefined): string | undefined => {
    if (!error) return undefined;
    const code = KNOWN_CODES.includes(error.type as KnownCode)
      ? (error.type as KnownCode)
      : 'custom';
    return t(`validation.${code}`);
  };
}
