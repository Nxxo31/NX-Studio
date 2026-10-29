// Atribucion de captacion — primera parte (first-party).
//
// Guardamos el PRIMER toque de la sesion (utm + referrer + pagina de
// aterrizaje) en sessionStorage: un lead que llega 3 paginas despues sigue
// reportando de donde vino. Sin esto no hay forma de saber que campana,
// canal o referencia trae clientes.
//
// Los eventos se envian a dos destinos:
//   1. Plausible (si hay dominio configurado) — dashboard externo, cookieless.
//   2. D1 via /api/analytics — datos propios, siempre disponibles.
//
// No se guardan IPs, cookies ni emails en los eventos.

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_path: string | null;
};

export const EMPTY_ATTRIBUTION: Attribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  referrer: null,
  landing_path: null,
};

const STORAGE_KEY = 'nx_attribution';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/**
 * Dominio de Plausible. Vacio = sin proveedor externo (los eventos siguen
 * yendo a D1). Se puede sobreescribir en build con
 * PUBLIC_ANALYTICS_DOMAIN=tu-dominio.com
 */
export const PLAUSIBLE_DOMAIN: string =
  (import.meta.env.PUBLIC_ANALYTICS_DOMAIN as string | undefined) || '';

function readStorage(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Attribution>;
    return { ...EMPTY_ATTRIBUTION, ...parsed };
  } catch {
    return null;
  }
}

function writeStorage(value: Attribution): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* modo privado / storage lleno: la atribucion es best-effort */
  }
}

/**
 * Captura la atribucion de la URL actual y la mergea con la de la sesion.
 * Los parametros UTM de la URL actual tienen prioridad (campana en curso);
 * el resto se hereda del primer toque.
 */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return EMPTY_ATTRIBUTION;
  const params = new URLSearchParams(window.location.search);
  const prev = readStorage();
  const next: Attribution = { ...EMPTY_ATTRIBUTION };

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    next[key] = value && value.length > 0 ? value.slice(0, 120) : prev?.[key] ?? null;
  }

  const ref = document.referrer;
  next.referrer = ref && ref.length > 0 ? ref.slice(0, 300) : prev?.referrer ?? null;
  next.landing_path = prev?.landing_path ?? window.location.pathname;

  writeStorage(next);
  return next;
}

/** Atribucion de la sesion (sin escribir). */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return EMPTY_ATTRIBUTION;
  return readStorage() ?? captureAttribution();
}

type PlausibleWindow = {
  plausible?: (name: string, options?: { props?: Record<string, unknown> }) => void;
};

/**
 * Registra un evento de conversion (o page view).
 * Nunca lanza: si el beacon falla, la pagina sigue igual.
 */
export function trackEvent(
  name: string,
  props: Record<string, string | number | boolean> = {}
): void {
  if (typeof window === 'undefined') return;

  try {
    const w = window as unknown as PlausibleWindow;
    w.plausible?.(name, { props });
  } catch {
    /* el proveedor externo puede faltar: no es critico */
  }

  try {
    const attribution = getAttribution();
    const payload = JSON.stringify({
      name,
      path: window.location.pathname,
      locale: document.documentElement.lang || null,
      utm_source: attribution.utm_source,
      referrer: attribution.referrer,
      props,
    });
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', blob);
    } else {
      void fetch('/api/analytics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    /* best-effort: la instrumentacion nunca rompe la experiencia */
  }
}
