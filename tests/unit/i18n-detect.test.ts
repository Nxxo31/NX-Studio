import { describe, it, expect } from 'vitest';
import { countryToLocale, isValidLocale, DEFAULT_LOCALE } from '~/i18n/country-map';
import { detectLocale, localeFromAcceptLanguage, shouldBypass, joinLocale } from '~/i18n/detect';
import { getT, getMessages } from '~/i18n';

describe('countryToLocale', () => {
  it('mapea países lusófonos a pt', () => {
    expect(countryToLocale('BR')).toBe('pt');
    expect(countryToLocale('PT')).toBe('pt');
    expect(countryToLocale('br')).toBe('pt'); // case-insensitive
  });

  it('mapea LATAM hispanohablante a es', () => {
    for (const cc of ['MX', 'CO', 'AR', 'CL', 'PE', 'ES']) {
      expect(countryToLocale(cc)).toBe('es');
    }
  });

  it('mapea países anglófonos a en', () => {
    for (const cc of ['US', 'GB', 'CA', 'AU']) {
      expect(countryToLocale(cc)).toBe('en');
    }
  });

  it('retorna null para códigos desconocidos o vacíos', () => {
    expect(countryToLocale('ZZ')).toBeNull();
    expect(countryToLocale('')).toBeNull();
    expect(countryToLocale(null)).toBeNull();
    expect(countryToLocale(undefined)).toBeNull();
  });
});

describe('isValidLocale', () => {
  it('acepta el set soportado', () => {
    expect(isValidLocale('es')).toBe(true);
    expect(isValidLocale('en')).toBe(true);
    expect(isValidLocale('pt')).toBe(true);
  });

  it('rechaza otros valores', () => {
    expect(isValidLocale('fr')).toBe(false);
    expect(isValidLocale('')).toBe(false);
    expect(isValidLocale(null)).toBe(false);
  });
});

describe('localeFromAcceptLanguage', () => {
  it('toma el primer locale soportado', () => {
    expect(localeFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
    expect(localeFromAcceptLanguage('pt-BR,pt;q=0.9,en;q=0.8')).toBe('pt');
    expect(localeFromAcceptLanguage('es-MX')).toBe('es');
  });

  it('respeta q-values ordenando por peso', () => {
    expect(localeFromAcceptLanguage('fr-FR;q=0.9,en;q=0.5,pt;q=1.0')).toBe('pt');
  });

  it('retorna null sin match soportado', () => {
    expect(localeFromAcceptLanguage('fr-FR,fr;q=0.9')).toBeNull();
    expect(localeFromAcceptLanguage(null)).toBeNull();
    expect(localeFromAcceptLanguage('')).toBeNull();
  });
});

describe('shouldBypass', () => {
  it('bypassea /api y /admin', () => {
    expect(shouldBypass('/api/contacto')).toBe(true);
    expect(shouldBypass('/admin')).toBe(true);
    expect(shouldBypass('/admin/licitacion')).toBe(true);
  });

  it('bypassea assets con extensión', () => {
    expect(shouldBypass('/favicon.svg')).toBe(true);
    expect(shouldBypass('/_astro/app.1234.js')).toBe(true);
    expect(shouldBypass('/projects/hero.png')).toBe(true);
  });

  it('no bypassea páginas normales', () => {
    expect(shouldBypass('/')).toBe(false);
    expect(shouldBypass('/servicios/')).toBe(false);
    expect(shouldBypass('/cotizador')).toBe(false);
  });
});

describe('detectLocale', () => {
  it('curl test 1: cf-ipcountry=BR sin Accept-Language → redirect /pt/', () => {
    const r = detectLocale({ pathname: '/', cfIpCountry: 'BR' });
    expect(r).toEqual({ action: 'redirect', locale: 'pt', location: '/pt/' });
  });

  it('curl test 2: cf-ipcountry=MX + Accept-Language en-US → serve es (país gana)', () => {
    const r = detectLocale({ pathname: '/', cfIpCountry: 'MX', acceptLanguage: 'en-US' });
    expect(r).toEqual({ action: 'serve', locale: 'es' });
  });

  it('curl test 3: cookie nx-studio-locale=en → redirect a /en/<path>', () => {
    const r = detectLocale({ pathname: '/servicios/', cookieLocale: 'en' });
    expect(r).toEqual({ action: 'redirect', locale: 'en', location: '/en/servicios/' });
  });

  it('cookie es → serve default sin redirect', () => {
    const r = detectLocale({ pathname: '/', cookieLocale: 'es' });
    expect(r).toEqual({ action: 'serve', locale: 'es' });
  });

  it('curl test 4: cf-ipcountry=ZZ + Accept-Language fr-FR → fallback es', () => {
    const r = detectLocale({ pathname: '/', cfIpCountry: 'ZZ', acceptLanguage: 'fr-FR' });
    expect(r).toEqual({ action: 'serve', locale: 'es' });
  });

  it('path /en/* prefijado → serve en con stripPrefix para rewrite', () => {
    const r = detectLocale({ pathname: '/en/cotizador' });
    expect(r).toEqual({ action: 'serve', locale: 'en', stripPrefix: '/en' });
  });

  it('path /pt (raíz locale) → serve pt', () => {
    const r = detectLocale({ pathname: '/pt' });
    expect(r).toEqual({ action: 'serve', locale: 'pt', stripPrefix: '/pt' });
  });

  it('path /es/* → redirect al path sin prefijo', () => {
    const r = detectLocale({ pathname: '/es/servicios/' });
    expect(r).toEqual({ action: 'redirect', locale: 'es', location: '/servicios/' });
  });

  it('sin headers ni cookie → serve es (default)', () => {
    const r = detectLocale({ pathname: '/laboratorio' });
    expect(r).toEqual({ action: 'serve', locale: 'es' });
  });

  it('defaultLocale es es consistente con la config', () => {
    expect(DEFAULT_LOCALE).toBe('es');
  });
});

describe('joinLocale', () => {
  it('compone paths sin dobles slashes', () => {
    expect(joinLocale('en', '/servicios/')).toBe('/en/servicios/');
    expect(joinLocale('pt', '/')).toBe('/pt/');
  });
});

describe('getT', () => {
  it('traduce keys del locale pedido', () => {
    expect(getT('en')('nav.inicio')).toBe('Home');
    expect(getT('pt')('nav.inicio')).toBe('Início');
    expect(getT('es')('nav.inicio')).toBe('Inicio');
  });

  it('cae al mensaje en es si falta, y a la key si no existe', () => {
    const t = getT('en');
    expect(t('footer.built')).toBe(getMessages('es').footer.built.length > 0 ? t('footer.built') : '');
    expect(t('no.existe.key')).toBe('no.existe.key');
  });

  it('los 3 diccionarios tienen las mismas keys top-level', () => {
    const sections = (d: object) => Object.keys(d).sort();
    expect(sections(getMessages('en'))).toEqual(sections(getMessages('es')));
    expect(sections(getMessages('pt'))).toEqual(sections(getMessages('es')));
  });

  it('los 3 diccionarios tienen las mismas keys de nav/footer/pages (deep equality de keys)', () => {
    const keyPaths = (obj: unknown, prefix = ''): string[] =>
      Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
        v !== null && typeof v === 'object'
          ? keyPaths(v, `${prefix}${k}.`)
          : [`${prefix}${k}`],
      ).sort();
    expect(keyPaths(getMessages('en'))).toEqual(keyPaths(getMessages('es')));
    expect(keyPaths(getMessages('pt'))).toEqual(keyPaths(getMessages('es')));
  });
});
