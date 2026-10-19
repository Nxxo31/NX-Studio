/**
 * Chatbot FSM (Finite State Machine) — SophIA.
 *
 * States: 'closed' | 'minimized' | 'open'
 * Persisted to localStorage under key STORAGE_KEY.
 *
 * Schema versionado para futura migración sin pisar datos de usuarios.
 * Si llega a haber un campo `schemaVersion` distinto al actual, el loader
 * debe descartar y arrancar con defaults (FSM auto-recuperación).
 *
 * Decisiones de diseño:
 * - Estado cerrado/minimizado/open vive como string literal union (no enum runtime).
 * - History está cappeado a MAX_HISTORY para no crecer indefinidamente.
 * - userContext es un objeto libre (placeholder para futuro: referrer, locale,
 *   userId si el portal expone sesión, etc.). Mantenerlo serializable.
 * - Todas las funciones son puras — fácil de testear sin DOM. El wrapper .astro
 *   es el que monta contra localStorage real.
 */

import type { Locale } from '../i18n/country-map';

/** Estados válidos del FSM del chatbot. */
export type ChatbotState = 'closed' | 'minimized' | 'open';

/** Mensaje individual en el historial. */
export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: number; // epoch ms
}

/** Schema persistido en localStorage. */
export interface ChatbotStorage {
  schemaVersion: 1;
  state: ChatbotState;
  history: ChatMessage[];
  userContext: Record<string, unknown>;
  lastUpdatedAt: number;
}

/** Transición válida entre estados. */
export const VALID_TRANSITIONS: Record<ChatbotState, ChatbotState[]> = {
  closed: ['open'],
  minimized: ['open', 'closed'],
  open: ['minimized', 'closed'],
};

/** Cap máximo de mensajes para no crecer indefinidamente. */
export const MAX_HISTORY = 50;

/** localStorage key. Namespace para evitar choques con otras features. */
export const STORAGE_KEY = 'nx-studio-chatbot:v1';

/** Schema version actual. Incrementar si cambia la shape. */
export const CURRENT_SCHEMA_VERSION = 1 as const;

/** Defaults cuando no hay storage o el schema es inválido. */
export function defaultStorage(): ChatbotStorage {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    state: 'closed',
    history: [],
    userContext: {},
    lastUpdatedAt: Date.now(),
  };
}

/**
 * Verifica si un objeto es un ChatbotStorage válido (type guard).
 * No valida cada campo exhaustivamente — solo lo necesario para no romper
 * el resto del FSM si llega basura del storage.
 */
export function isValidStorage(value: unknown): value is ChatbotStorage {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== CURRENT_SCHEMA_VERSION) return false;
  if (v.state !== 'closed' && v.state !== 'minimized' && v.state !== 'open') return false;
  if (!Array.isArray(v.history)) return false;
  if (!v.userContext || typeof v.userContext !== 'object') return false;
  if (typeof v.lastUpdatedAt !== 'number') return false;
  // history: cada item debe tener role/content/timestamp
  for (const msg of v.history) {
    if (!msg || typeof msg !== 'object') return false;
    const m = msg as Record<string, unknown>;
    if (m.role !== 'user' && m.role !== 'bot') return false;
    if (typeof m.content !== 'string') return false;
    if (typeof m.timestamp !== 'number') return false;
  }
  return true;
}

/**
 * Carga el storage desde un objeto crudo (lo que llega de JSON.parse).
 * Si es inválido o no existe, devuelve defaults. Pure function.
 */
export function loadStorage(raw: unknown): ChatbotStorage {
  if (isValidStorage(raw)) {
    return raw;
  }
  return defaultStorage();
}

/**
 * Aplica una transición de estado. Devuelve el storage actualizado,
 * o el mismo storage si la transición no es válida (FSM estricto).
 *
 * Nota: desde 'closed' solo se puede ir a 'open' — no tiene sentido
 * pasar de closed directamente a minimized sin haber abierto antes.
 */
export function transition(state: ChatbotState, target: ChatbotState): ChatbotState {
  const allowed = VALID_TRANSITIONS[state];
  if (!allowed.includes(target)) return state;
  return target;
}

/**
 * Push de un mensaje al history, con cap a MAX_HISTORY.
 * Si el array supera el límite, descarta los más viejos (FIFO).
 */
export function pushMessage(
  storage: ChatbotStorage,
  msg: ChatMessage,
): ChatbotStorage {
  const history = [...storage.history, msg];
  const trimmed = history.length > MAX_HISTORY
    ? history.slice(history.length - MAX_HISTORY)
    : history;
  return {
    ...storage,
    history: trimmed,
    lastUpdatedAt: Date.now(),
  };
}

/**
 * Borra el historial pero mantiene el estado y el userContext.
 * Útil para /reset command.
 */
export function resetHistory(storage: ChatbotStorage): ChatbotStorage {
  return {
    ...storage,
    history: [],
    lastUpdatedAt: Date.now(),
  };
}

/**
 * Helper para construir un mensaje en el formato correcto.
 * Mantiene el contrato de tipos centralizado.
 */
export function makeMessage(
  role: 'user' | 'bot',
  content: string,
  timestamp: number = Date.now(),
): ChatMessage {
  return { role, content, timestamp };
}

/**
 * Sanea el input del usuario antes de enviarlo al bot.
 * - Trimea whitespace
 * - Cap a MAX_INPUT_LENGTH (defensa contra inputs gigantes)
 * - Si queda vacío, devuelve null (señal de "ignorar")
 */
export const MAX_INPUT_LENGTH = 500;

export function sanitizeInput(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return trimmed.slice(0, MAX_INPUT_LENGTH);
  }
  return trimmed;
}

/**
 * Pathname allowlist — el chatbot SOLO se monta en marketing pages.
 * Excluido de /portal/*, /admin/*, /api/*.
 *
 * El chequeo se hace contra la primera '/' seg del pathname, así:
 *   /portal/login      → exclude (matches /portal)
 *   /admin/usuarios    → exclude (matches /admin)
 *   /api/foo           → exclude (matches /api)
 *   /                  → include
 *   /servicios/        → include
 *   /en/portal/login   → exclude (locale prefix + /portal)
 *
 * Soporta el routing i18n (memo #191) que tiene prefijo /en /pt.
 */
export const CHATBOT_EXCLUDED_PREFIXES = ['/portal', '/admin', '/api'] as const;

export function shouldRenderChatbot(pathname: string): boolean {
  if (!pathname || typeof pathname !== 'string') return false;
  // Normaliza: si arranca con /en o /pt, sácale el prefijo para evaluar.
  const segs = pathname.split('/').filter(Boolean);
  const first = segs[0] ?? '';
  const stripped = (first === 'en' || first === 'pt' || first === 'es')
    ? '/' + segs.slice(1).join('/')
    : pathname;
  const bare = stripped === '' ? '/' : stripped;
  return !CHATBOT_EXCLUDED_PREFIXES.some((p) => bare === p || bare.startsWith(p + '/') || bare.startsWith(p));
}

/** Locale-aware (placeholder). El wrapper real pasa el locale vía Astro. */
export type ChatbotLocale = Locale;
