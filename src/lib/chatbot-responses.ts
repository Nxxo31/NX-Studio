/**
 * Mock responses engine para SophIA (chatbot flotante, Phase 6).
 *
 * NO usa backend real — tabla de keywords + respuestas pre-canned.
 * Sigue el mismo patrón que el Lab mockup generator (consultar
 * `src/lib/mockup.ts` para referencia de cómo mockear sin servidor).
 *
 * Diseño:
 * - Tabla de intents: cada intent tiene keywords[] (lowercase, normalizadas)
 *   + un handler que devuelve la respuesta en función del locale.
 * - Comandos con prefijo `/` se evalúan antes (help, reset, portalsignup).
 * - Si no matchea ningún intent, devuelve `unknown` mock.
 * - Las respuestas son strings estáticos localizados — la versión i18n
 *   real pasa por `t('chatbot.mock_*')` en el wrapper React.
 *   Esta tabla aporta los KEYS (sin el string traducido) para mantener
 *   este módulo puro y testeable.
 *
 * Para añadir un intent nuevo:
 *   1. Añadir key i18n en es.json/en.json/pt.json bajo chatbot.*
 *   2. Añadir entrada en INTENTS con keywords[] y un key de respuesta
 *   3. (Opcional) extender tests en tests/unit/chatbot-fsm.test.ts
 */

import { sanitizeInput } from './chatbot-fsm';

/** Tipo de respuesta que el bot puede dar. */
export type BotResponseKind =
  | 'greeting'
  | 'pricing'
  | 'handoff'
  | 'help'
  | 'reset'
  | 'portalsignup'
  | 'services'
  | 'templates'
  | 'labs'
  | 'contact'
  | 'thanks'
  | 'unknown';

/** Respuesta procesada del motor. */
export interface BotResponse {
  /** Tipo lógico — útil para analytics futuro y tests. */
  kind: BotResponseKind;
  /** i18n key a traducir en el wrapper (sin locale aún). */
  contentKey: string;
  /** Cuando aplica, command que el bot sugiere al usuario. */
  suggestedCommand?: string;
}

/** Tipo de intent para la tabla. */
interface Intent {
  kind: BotResponseKind;
  contentKey: string;
  /** Keywords a matchear (lowercase, normalizadas). */
  keywords: readonly string[];
  suggestedCommand?: string;
}

/**
 * Tabla de intents. Orden importa: el primer match gana.
 * Keywords se matchean como substring case-insensitive.
 */
export const INTENTS: readonly Intent[] = [
  {
    kind: 'help',
    contentKey: 'chatbot.help_text',
    keywords: ['/help', 'help', 'ayuda', 'ajuda', 'commands', 'comandos', 'que puedes hacer', 'what can you do'],
  },
  {
    kind: 'reset',
    contentKey: 'chatbot.reset_done',
    keywords: ['/reset', 'reset', 'borrar', 'limpiar', 'clear', 'empezar de cero'],
  },
  {
    kind: 'portalsignup',
    contentKey: 'chatbot.portalsignup',
    keywords: ['/portalsignup', 'portal signup', 'registrar portal', 'crear cuenta portal'],
  },
  {
    kind: 'greeting',
    contentKey: 'chatbot.mock_greeting',
    keywords: ['hola', 'hello', 'hi', 'buenas', 'buenos dias', 'buenas tardes', 'ola', 'oi'],
  },
  {
    kind: 'pricing',
    contentKey: 'chatbot.mock_pricing',
    keywords: ['precio', 'precios', 'pricing', 'costo', 'coste', 'cuanto', 'cuánto', 'cotizar', 'cotizacion', 'cotización', 'presupuesto', 'how much', 'cost', 'quote', 'budget'],
  },
  {
    kind: 'handoff',
    contentKey: 'chatbot.mock_handoff',
    keywords: ['humano', 'human', 'persona', 'agente', 'equipo', 'hablar con alguien', 'talk to someone', 'representante', 'soporte', 'support'],
  },
  {
    kind: 'services',
    contentKey: 'chatbot.mock_services',
    keywords: ['servicios', 'services', 'que ofrecen', 'what do you offer', 'productos', 'products'],
  },
  {
    kind: 'templates',
    contentKey: 'chatbot.mock_templates',
    keywords: ['template', 'templates', 'plantilla', 'plantillas', 'comprar template', 'buy template'],
  },
  {
    kind: 'labs',
    contentKey: 'chatbot.mock_labs',
    keywords: ['laboratorio', 'lab', 'labs', 'experimento', 'experiment', 'demo'],
  },
  {
    kind: 'contact',
    contentKey: 'chatbot.mock_contact',
    keywords: ['contacto', 'contact', 'email', 'correo', 'telefono', 'teléfono', 'whatsapp'],
  },
  {
    kind: 'thanks',
    contentKey: 'chatbot.mock_thanks',
    keywords: ['gracias', 'thanks', 'thank you', 'obrigado', 'valeu'],
  },
];

/**
 * Normaliza el input para matching:
 *  - lowercase
 *  - trim
 *  - colapsa whitespace
 *  - remueve acentos (NFD + strip combining marks)
 *  - remueve signos de puntuación inicial comunes en ES (¿, ¡)
 *    para que "¿Cómo estás?" matchee igual que "como estas?"
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^[¿¡]+/, '')
    .replace(/\s+/g, ' ');
}

/**
 * Matchea el primer intent cuyas keywords aparezcan en el input normalizado.
 * `null` si nada matchea.
 */
export function matchIntent(rawInput: string): Intent | null {
  const clean = sanitizeInput(rawInput);
  if (clean === null) return null;
  const normalized = normalize(clean);
  for (const intent of INTENTS) {
    for (const kw of intent.keywords) {
      const normKw = normalize(kw);
      // Match exacto para comandos (`/help`, `/reset`); substring para el resto.
      if (normKw.startsWith('/')) {
        if (normalized === normKw || normalized.startsWith(normKw + ' ')) {
          return intent;
        }
      } else if (normalized.includes(normKw)) {
        return intent;
      }
    }
  }
  return null;
}

/**
 * Procesa el input del usuario y devuelve la respuesta del bot.
 * Esta es la función principal que el wrapper React invoca.
 *
 * Si el usuario envía `/help` o `/reset` o `/portalsignup`, devuelve
 * metadata extra (`suggestedCommand`, `reset` flag) además del kind.
 */
export interface ProcessResult {
  response: BotResponse;
  /** Cuando true, el cliente debe ejecutar el side effect (ej. /reset). */
  sideEffect?: 'reset' | 'redirect-portal-login';
}

/**
 * Mapa de side effects por command (slash commands).
 * Mantener en sync con `src/lib/chatbot-fsm.ts` y la tabla INTENTS.
 */
export const COMMAND_SIDE_EFFECTS: Record<string, ProcessResult['sideEffect']> = {
  '/help': undefined,
  '/reset': 'reset',
  '/portalsignup': 'redirect-portal-login',
};

export function processInput(rawInput: string): ProcessResult {
  const clean = sanitizeInput(rawInput);
  if (clean === null) {
    return {
      response: { kind: 'unknown', contentKey: 'chatbot.mock_unknown' },
    };
  }
  const intent = matchIntent(clean);
  if (!intent) {
    return {
      response: { kind: 'unknown', contentKey: 'chatbot.mock_unknown' },
    };
  }
  const sideEffect = COMMAND_SIDE_EFFECTS[intent.keywords[0] ?? ''];
  return {
    response: {
      kind: intent.kind,
      contentKey: intent.contentKey,
      suggestedCommand: intent.suggestedCommand,
    },
    sideEffect,
  };
}

/** Bot greeting inicial (cuando el panel se abre por primera vez). */
export const INITIAL_GREETING_KIND: BotResponseKind = 'greeting';
export const INITIAL_GREETING_KEY = 'chatbot.mock_greeting';
