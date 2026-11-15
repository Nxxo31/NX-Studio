// Geo → Currency mapping (open-source, sin API keys)
// Cloudflare inyecta cf-ipcountry en el request

export type Currency = {
  code: string;          // ISO 4217
  symbol: string;        // $ € £ R$ etc.
  locale: string;        // para Intl.NumberFormat
  name: { es: string; en: string; pt: string };
};

export const CURRENCIES: Record<string, Currency> = {
  // LatAm
  COP: { code: 'COP', symbol: '$', locale: 'es-CO', name: { es: 'Peso colombiano', en: 'Colombian peso', pt: 'Peso colombiano' } },
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', name: { es: 'Real brasileño', en: 'Brazilian real', pt: 'Real brasileiro' } },
  MXN: { code: 'MXN', symbol: '$', locale: 'es-MX', name: { es: 'Peso mexicano', en: 'Mexican peso', pt: 'Peso mexicano' } },
  ARS: { code: 'ARS', symbol: '$', locale: 'es-AR', name: { es: 'Peso argentino', en: 'Argentine peso', pt: 'Peso argentino' } },
  CLP: { code: 'CLP', symbol: '$', locale: 'es-CL', name: { es: 'Peso chileno', en: 'Chilean peso', pt: 'Peso chileno' } },
  PEN: { code: 'PEN', symbol: 'S/', locale: 'es-PE', name: { es: 'Sol peruano', en: 'Peruvian sol', pt: 'Sol peruano' } },
  UYU: { code: 'UYU', symbol: '$', locale: 'es-UY', name: { es: 'Peso uruguayo', en: 'Uruguayan peso', pt: 'Peso uruguaio' } },
  CRC: { code: 'CRC', symbol: '₡', locale: 'es-CR', name: { es: 'Colón costarricense', en: 'Costa Rican colón', pt: 'Colão costarriquenho' } },
  DOP: { code: 'DOP', symbol: '$', locale: 'es-DO', name: { es: 'Peso dominicano', en: 'Dominican peso', pt: 'Peso dominicano' } },
  VES: { code: 'VES', symbol: 'Bs.', locale: 'es-VE', name: { es: 'Bolívar venezolano', en: 'Venezuelan bolívar', pt: 'Bolívar venezuelano' } },
  BOB: { code: 'BOB', symbol: 'Bs.', locale: 'es-BO', name: { es: 'Boliviano', en: 'Bolivian boliviano', pt: 'Boliviano' } },
  PYG: { code: 'PYG', symbol: '₲', locale: 'es-PY', name: { es: 'Guaraní paraguayo', en: 'Paraguayan guaraní', pt: 'Guaraní paraguaio' } },
  GTQ: { code: 'GTQ', symbol: 'Q', locale: 'es-GT', name: { es: 'Quetzal guatemalteco', en: 'Guatemalan quetzal', pt: 'Quetzal guatemalteco' } },
  HNL: { code: 'HNL', symbol: 'L', locale: 'es-HN', name: { es: 'Lempira hondureño', en: 'Honduran lempira', pt: 'Lempira hondurenho' } },
  NIO: { code: 'NIO', symbol: 'C$', locale: 'es-NI', name: { es: 'Córdoba nicaragüense', en: 'Nicaraguan córdoba', pt: 'Córdoba nicaraguense' } },
  PAB: { code: 'PAB', symbol: 'B/.', locale: 'es-PA', name: { es: 'Balboa panameño', en: 'Panamanian balboa', pt: 'Balboa panamenho' } },
  // Ecuador, El Salvador, Panamá usan USD
  USD: { code: 'USD', symbol: '$', locale: 'en-US', name: { es: 'Dólar estadounidense', en: 'US dollar', pt: 'Dólar americano' } },
  // Norte
  CAD: { code: 'CAD', symbol: '$', locale: 'en-CA', name: { es: 'Dólar canadiense', en: 'Canadian dollar', pt: 'Dólar canadense' } },
  // Europa - Eurozona
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', name: { es: 'Euro', en: 'Euro', pt: 'Euro' } },
  // Europa - No euro
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', name: { es: 'Libra esterlina', en: 'British pound', pt: 'Libra esterlina' } },
  CHF: { code: 'CHF', symbol: 'CHF', locale: 'de-CH', name: { es: 'Franco suizo', en: 'Swiss franc', pt: 'Franco suíço' } },
  SEK: { code: 'SEK', symbol: 'kr', locale: 'sv-SE', name: { es: 'Corona sueca', en: 'Swedish krona', pt: 'Coroa sueca' } },
  NOK: { code: 'NOK', symbol: 'kr', locale: 'nb-NO', name: { es: 'Corona noruega', en: 'Norwegian krone', pt: 'Coroa norueguesa' } },
  DKK: { code: 'DKK', symbol: 'kr', locale: 'da-DK', name: { es: 'Corona danesa', en: 'Danish krone', pt: 'Coroa dinamarquesa' } },
  PLN: { code: 'PLN', symbol: 'zł', locale: 'pl-PL', name: { es: 'Zloty polaco', en: 'Polish złoty', pt: 'Zloty polonês' } },
  CZK: { code: 'CZK', symbol: 'Kč', locale: 'cs-CZ', name: { es: 'Corona checa', en: 'Czech koruna', pt: 'Coroa checa' } },
  HUF: { code: 'HUF', symbol: 'Ft', locale: 'hu-HU', name: { es: 'Forinto húngaro', en: 'Hungarian forint', pt: 'Forint húngaro' } },
  RON: { code: 'RON', symbol: 'lei', locale: 'ro-RO', name: { es: 'Leu rumano', en: 'Romanian leu', pt: 'Leu romeno' } },
  BGN: { code: 'BGN', symbol: 'лв', locale: 'bg-BG', name: { es: 'Lev búlgaro', en: 'Bulgarian lev', pt: 'Lev búlgaro' } },
  HRK: { code: 'HRK', symbol: 'kn', locale: 'hr-HR', name: { es: 'Kuna croata', en: 'Croatian kuna', pt: 'Kuna croata' } },
  ISK: { code: 'ISK', symbol: 'kr', locale: 'is-IS', name: { es: 'Corona islandesa', en: 'Icelandic króna', pt: 'Coroa islandesa' } },
  // Resto mundo fallback
  USD_FALLBACK: { code: 'USD', symbol: '$', locale: 'en-US', name: { es: 'Dólar estadounidense', en: 'US dollar', pt: 'Dólar americano' } },
};

/** Mapeo país ISO-2 → moneda principal */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // LatAm
  CO: 'COP', BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', PE: 'PEN',
  UY: 'UYU', CR: 'CRC', DO: 'DOP', VE: 'VES', BO: 'BOB', PY: 'PYG',
  GT: 'GTQ', HN: 'HNL', NI: 'NIO', SV: 'USD', PA: 'PAB', CU: 'USD',
  EC: 'USD', // Ecuador usa USD
  // Norte
  US: 'USD', CA: 'CAD',
  // Europa - Eurozona
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', PT: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR',
  SI: 'EUR', SK: 'EUR', LT: 'EUR', LV: 'EUR', EE: 'EUR', MT: 'EUR', CY: 'EUR',
  // Europa - No euro
  GB: 'GBP', CH: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK', PL: 'PLN',
  CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', HR: 'HRK', IS: 'ISK',
  // Resto mundo -> USD fallback
};

/** Detecta moneda desde request (Cloudflare headers) */
export function detectCurrency(request: Request): Currency {
  const country = request.headers.get('cf-ipcountry')?.toUpperCase() ?? 'US';
  const code = COUNTRY_TO_CURRENCY[country] ?? 'USD';
  return CURRENCIES[code] ?? CURRENCIES.USD;
}

/** Formatea número en moneda detectada */
export function formatCurrency(amount: number, currency: Currency): string {
  try {
    const maxFraction = currency.code === 'JPY' || currency.code === 'KRW' ? 0 : 2;
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: maxFraction,
    }).format(amount);
  } catch {
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
}

/** Convierte USD → moneda destino usando tasas */
export function convertUsdTo(amountUsd: number, rate: number): number {
  return Math.round(amountUsd * rate);
}

/** Obtiene la tasa USD → currencyCode desde objeto de tasas */
export function getRate(rates: Record<string, number>, currencyCode: string): number {
  return rates[currencyCode] ?? 1;
}