/**
 * ISO 3166-1 alpha-2 → locale NX-Studio.
 * Set de idiomas (memo #191): ES (LATAM default) + EN (internacional) + PT (Brasil/lusófono).
 * Países no mapeados caen al fallback Accept-Language → 'es'.
 */

export type Locale = 'es' | 'en' | 'pt';

export const LOCALES: readonly Locale[] = ['es', 'en', 'pt'] as const;
export const DEFAULT_LOCALE: Locale = 'es';

const PT_COUNTRIES = new Set([
  'BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL',
]);

const ES_COUNTRIES = new Set([
  // LATAM hispanohablante
  'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY',
  'CR', 'PA', 'DO', 'GT', 'HN', 'SV', 'NI', 'CU', 'PR',
  // Europa/África
  'ES', 'GQ', 'AD', // AD: catalán oficial, ES fuerte como segunda lengua
]);

const EN_COUNTRIES = new Set([
  'US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'ZA', 'IN', 'SG', 'PH', 'NG',
  'KE', 'GH', 'JM', 'TT', 'BZ', 'GY', 'MT', 'HK',
]);

/**
 * Mapea código de país ISO 3166-1 alpha-2 (cf-ipcountry) a locale.
 * Retorna null si el país es desconocido/no mapeado (el caller
 * continúa la cadena de fallback con Accept-Language).
 */
export function countryToLocale(countryCode: string | null | undefined): Locale | null {
  if (!countryCode) return null;
  const cc = countryCode.trim().toUpperCase();
  if (PT_COUNTRIES.has(cc)) return 'pt';
  if (ES_COUNTRIES.has(cc)) return 'es';
  if (EN_COUNTRIES.has(cc)) return 'en';
  return null;
}

export function isValidLocale(value: string | null | undefined): value is Locale {
  return value === 'es' || value === 'en' || value === 'pt';
}
