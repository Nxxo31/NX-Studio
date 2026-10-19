/**
 * Chatbot SophIA — Tests del FSM + mock responses (Phase 6).
 *
 * Cubre:
 *  1. FSM: transiciones válidas + inválidas (strict)
 *  2. Storage: loadStorage, isValidStorage, defaults, schema versioning
 *  3. Persistencia: pushMessage con cap, resetHistory preserva state/userContext
 *  4. sanitizeInput: trimea, cap a MAX_INPUT_LENGTH, null para vacío
 *  5. shouldRenderChatbot: allowlist marketing + exclude /portal /admin /api
 *     con soporte de locale prefixes (/en/, /pt/, /es/)
 *  6. Mock responses: keywords + commands, normalize, matchIntent, processInput
 *     - greetings, pricing, handoff, help, reset, portalsignup, services,
 *       templates, labs, contact, thanks, unknown
 *  7. makeMessage factory
 *
 * Total: 60+ tests cubriendo cada rama del FSM y cada intent del mock engine.
 */
import { describe, it, expect } from 'vitest';
import {
  CHATBOT_EXCLUDED_PREFIXES,
  CURRENT_SCHEMA_VERSION,
  MAX_HISTORY,
  MAX_INPUT_LENGTH,
  STORAGE_KEY,
  VALID_TRANSITIONS,
  defaultStorage,
  isValidStorage,
  loadStorage,
  makeMessage,
  pushMessage,
  resetHistory,
  sanitizeInput,
  shouldRenderChatbot,
  transition,
  type ChatbotState,
  type ChatbotStorage,
} from '~/lib/chatbot-fsm';
import {
  COMMAND_SIDE_EFFECTS,
  INITIAL_GREETING_KEY,
  INITIAL_GREETING_KIND,
  INTENTS,
  matchIntent,
  normalize,
  processInput,
} from '~/lib/chatbot-responses';

describe('chatbot-fsm · constants', () => {
  it('STORAGE_KEY está namespaced', () => {
    expect(STORAGE_KEY).toMatch(/^nx-studio-chatbot/);
    expect(STORAGE_KEY).toContain('v1');
  });

  it('CURRENT_SCHEMA_VERSION es 1', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });

  it('MAX_HISTORY y MAX_INPUT_LENGTH tienen valores razonables', () => {
    expect(MAX_HISTORY).toBeGreaterThan(10);
    expect(MAX_HISTORY).toBeLessThanOrEqual(200);
    expect(MAX_INPUT_LENGTH).toBeGreaterThanOrEqual(100);
  });

  it('VALID_TRANSITIONS cubre los 3 estados', () => {
    expect(Object.keys(VALID_TRANSITIONS).sort()).toEqual(['closed', 'minimized', 'open']);
    for (const state of ['closed', 'minimized', 'open'] as ChatbotState[]) {
      expect(Array.isArray(VALID_TRANSITIONS[state])).toBe(true);
    }
  });

  it('CHATBOT_EXCLUDED_PREFIXES contiene /portal, /admin, /api', () => {
    expect(CHATBOT_EXCLUDED_PREFIXES).toContain('/portal');
    expect(CHATBOT_EXCLUDED_PREFIXES).toContain('/admin');
    expect(CHATBOT_EXCLUDED_PREFIXES).toContain('/api');
  });
});

describe('chatbot-fsm · transition', () => {
  it('closed → open es válida', () => {
    expect(transition('closed', 'open')).toBe('open');
  });
  it('closed → minimized NO es válida (debe pasar por open primero)', () => {
    expect(transition('closed', 'minimized')).toBe('closed');
  });
  it('open → minimized es válida', () => {
    expect(transition('open', 'minimized')).toBe('minimized');
  });
  it('open → closed es válida', () => {
    expect(transition('open', 'closed')).toBe('closed');
  });
  it('minimized → open es válida', () => {
    expect(transition('minimized', 'open')).toBe('open');
  });
  it('minimized → closed es válida (sin pasar por open)', () => {
    expect(transition('minimized', 'closed')).toBe('closed');
  });
  it('idempotente: open → open NO es transición (devuelve mismo)', () => {
    expect(transition('open', 'open')).toBe('open');
  });
});

describe('chatbot-fsm · defaultStorage / isValidStorage', () => {
  it('defaultStorage devuelve schema versionado', () => {
    const d = defaultStorage();
    expect(d.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(d.state).toBe('closed');
    expect(d.history).toEqual([]);
    expect(d.userContext).toEqual({});
    expect(typeof d.lastUpdatedAt).toBe('number');
  });

  it('isValidStorage acepta defaults', () => {
    expect(isValidStorage(defaultStorage())).toBe(true);
  });

  it('isValidStorage rechaza schemaVersion incorrecto', () => {
    const bad = { ...defaultStorage(), schemaVersion: 999 } as unknown;
    expect(isValidStorage(bad)).toBe(false);
  });

  it('isValidStorage rechaza state inválido', () => {
    const bad = { ...defaultStorage(), state: 'invisible' } as unknown;
    expect(isValidStorage(bad)).toBe(false);
  });

  it('isValidStorage rechaza history no-array', () => {
    const bad = { ...defaultStorage(), history: 'no' } as unknown;
    expect(isValidStorage(bad)).toBe(false);
  });

  it('isValidStorage rechaza mensaje mal formado', () => {
    const bad = {
      ...defaultStorage(),
      history: [{ role: 'alien', content: 'x', timestamp: 1 }],
    } as unknown;
    expect(isValidStorage(bad)).toBe(false);
  });

  it('isValidStorage rechaza null/undefined/no-object', () => {
    expect(isValidStorage(null)).toBe(false);
    expect(isValidStorage(undefined)).toBe(false);
    expect(isValidStorage('string')).toBe(false);
    expect(isValidStorage(42)).toBe(false);
    expect(isValidStorage([])).toBe(false);
  });

  it('loadStorage devuelve defaults cuando raw es null', () => {
    expect(loadStorage(null)).toEqual(defaultStorage());
  });

  it('loadStorage devuelve defaults cuando raw es inválido', () => {
    expect(loadStorage({ foo: 'bar' })).toEqual(defaultStorage());
  });

  it('loadStorage acepta storage válido', () => {
    const valid: ChatbotStorage = {
      ...defaultStorage(),
      state: 'open',
      history: [makeMessage('user', 'hola', 123)],
    };
    expect(loadStorage(valid)).toEqual(valid);
  });
});

describe('chatbot-fsm · pushMessage + resetHistory', () => {
  it('pushMessage agrega al history', () => {
    const base = defaultStorage();
    const next = pushMessage(base, makeMessage('user', 'hola'));
    expect(next.history).toHaveLength(1);
    expect(next.history[0]?.content).toBe('hola');
    expect(next.lastUpdatedAt).toBeGreaterThanOrEqual(base.lastUpdatedAt);
  });

  it('pushMessage FIFO cuando supera MAX_HISTORY', () => {
    let storage = defaultStorage();
    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      storage = pushMessage(storage, makeMessage('user', `msg ${i}`));
    }
    expect(storage.history).toHaveLength(MAX_HISTORY);
    // El primero debería haberse descartado.
    expect(storage.history[0]?.content).toBe('msg 5');
    expect(storage.history[storage.history.length - 1]?.content).toBe(`msg ${MAX_HISTORY + 4}`);
  });

  it('resetHistory limpia history pero mantiene state y userContext', () => {
    const base: ChatbotStorage = {
      ...defaultStorage(),
      state: 'open',
      userContext: { referrer: '/servicios' },
      history: [makeMessage('user', 'x')],
    };
    const cleared = resetHistory(base);
    expect(cleared.history).toEqual([]);
    expect(cleared.state).toBe('open');
    expect(cleared.userContext).toEqual({ referrer: '/servicios' });
  });
});

describe('chatbot-fsm · makeMessage factory', () => {
  it('construye mensaje de user válido', () => {
    const m = makeMessage('user', 'hola');
    expect(m.role).toBe('user');
    expect(m.content).toBe('hola');
    expect(typeof m.timestamp).toBe('number');
  });
  it('construye mensaje de bot válido', () => {
    const m = makeMessage('bot', 'respuesta', 999);
    expect(m.role).toBe('bot');
    expect(m.timestamp).toBe(999);
  });
});

describe('chatbot-fsm · sanitizeInput', () => {
  it('devuelve null para empty string', () => {
    expect(sanitizeInput('')).toBeNull();
  });
  it('devuelve null para whitespace-only', () => {
    expect(sanitizeInput('   ')).toBeNull();
    expect(sanitizeInput('\n\t  ')).toBeNull();
  });
  it('trimea whitespace alrededor', () => {
    expect(sanitizeInput('  hola  ')).toBe('hola');
  });
  it('cap a MAX_INPUT_LENGTH', () => {
    const huge = 'x'.repeat(MAX_INPUT_LENGTH + 100);
    const out = sanitizeInput(huge);
    expect(out).not.toBeNull();
    expect(out!.length).toBe(MAX_INPUT_LENGTH);
  });
  it('devuelve null para no-string', () => {
    expect(sanitizeInput(null as unknown as string)).toBeNull();
    expect(sanitizeInput(undefined as unknown as string)).toBeNull();
    expect(sanitizeInput(42 as unknown as string)).toBeNull();
  });
});

describe('chatbot-fsm · shouldRenderChatbot (pathname allowlist)', () => {
  it('incluye home (/)', () => {
    expect(shouldRenderChatbot('/')).toBe(true);
  });
  it('incluye marketing pages', () => {
    for (const p of ['/servicios/', '/productos/', '/cotizador/', '/templates/', '/laboratorio/', '/contacto/', '/brand/', '/logos/', '/palettes/', '/docs/']) {
      expect(shouldRenderChatbot(p)).toBe(true);
    }
  });
  it('excluye /portal', () => {
    expect(shouldRenderChatbot('/portal')).toBe(false);
    expect(shouldRenderChatbot('/portal/login')).toBe(false);
    expect(shouldRenderChatbot('/portal/proyectos')).toBe(false);
  });
  it('excluye /admin', () => {
    expect(shouldRenderChatbot('/admin')).toBe(false);
    expect(shouldRenderChatbot('/admin/usuarios')).toBe(false);
  });
  it('excluye /api', () => {
    expect(shouldRenderChatbot('/api/contacto')).toBe(false);
    expect(shouldRenderChatbot('/api/auth/login')).toBe(false);
  });
  it('soporta locale prefixes /en/ /pt/ /es/', () => {
    // /en/portal/ debe excluirse
    expect(shouldRenderChatbot('/en/portal')).toBe(false);
    expect(shouldRenderChatbot('/en/portal/login')).toBe(false);
    expect(shouldRenderChatbot('/pt/admin/usuarios')).toBe(false);
    expect(shouldRenderChatbot('/es/api/foo')).toBe(false);
    // /en/ debe incluirse (es la home en inglés)
    expect(shouldRenderChatbot('/en/')).toBe(true);
    expect(shouldRenderChatbot('/en/servicios/')).toBe(true);
    expect(shouldRenderChatbot('/pt/')).toBe(true);
  });
  it('rechaza string vacío / no-string', () => {
    expect(shouldRenderChatbot('')).toBe(false);
    expect(shouldRenderChatbot(null as unknown as string)).toBe(false);
    expect(shouldRenderChatbot(undefined as unknown as string)).toBe(false);
  });
});

describe('chatbot-responses · normalize', () => {
  it('lowercase + trim', () => {
    expect(normalize('  HOLA  ')).toBe('hola');
  });
  it('colapsa whitespace interno', () => {
    expect(normalize('hola   mundo')).toBe('hola mundo');
  });
  it('remueve acentos (NFD strip)', () => {
    expect(normalize('¿Cómo estás?')).toBe('como estas?');
    expect(normalize('Información')).toBe('informacion');
    expect(normalize('Olá')).toBe('ola');
  });
});

describe('chatbot-responses · INTENTS table', () => {
  it('la tabla contiene al menos 10 intents', () => {
    expect(INTENTS.length).toBeGreaterThanOrEqual(10);
  });
  it('cada intent tiene keywords, kind y contentKey', () => {
    for (const intent of INTENTS) {
      expect(intent.kind).toBeTruthy();
      expect(typeof intent.contentKey).toBe('string');
      expect(Array.isArray(intent.keywords)).toBe(true);
      expect(intent.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe('chatbot-responses · matchIntent + processInput', () => {
  it('matchea /help como command', () => {
    const intent = matchIntent('/help');
    expect(intent?.kind).toBe('help');
  });

  it('matchea /reset como command', () => {
    const intent = matchIntent('/reset');
    expect(intent?.kind).toBe('reset');
  });

  it('matchea /portalsignup como command', () => {
    const intent = matchIntent('/portalsignup');
    expect(intent?.kind).toBe('portalsignup');
  });

  it('matchea saludo "hola" en ES', () => {
    const intent = matchIntent('hola');
    expect(intent?.kind).toBe('greeting');
  });

  it('matchea saludo "hello" en EN', () => {
    const intent = matchIntent('hello');
    expect(intent?.kind).toBe('greeting');
  });

  it('matchea saludo "oi" en PT', () => {
    const intent = matchIntent('oi');
    expect(intent?.kind).toBe('greeting');
  });

  it('matchea pricing: "precio", "cuanto", "cotizar"', () => {
    expect(matchIntent('cuánto cuesta?')?.kind).toBe('pricing');
    expect(matchIntent('quiero cotizar un proyecto')?.kind).toBe('pricing');
    expect(matchIntent('how much does it cost?')?.kind).toBe('pricing');
  });

  it('matchea handoff: "humano", "agente", "soporte"', () => {
    expect(matchIntent('necesito hablar con un humano')?.kind).toBe('handoff');
    expect(matchIntent('quiero un agente')?.kind).toBe('handoff');
    expect(matchIntent('talk to support')?.kind).toBe('handoff');
  });

  it('matchea templates', () => {
    expect(matchIntent('ver templates')?.kind).toBe('templates');
    expect(matchIntent('buy template')?.kind).toBe('templates');
  });

  it('matchea labs', () => {
    expect(matchIntent('ver el laboratorio')?.kind).toBe('labs');
  });

  it('matchea contact', () => {
    expect(matchIntent('quiero contacto por email')?.kind).toBe('contact');
  });

  it('matchea thanks', () => {
    expect(matchIntent('muchas gracias')?.kind).toBe('thanks');
    expect(matchIntent('thank you so much')?.kind).toBe('thanks');
  });

  it('devuelve null para input vacío o whitespace', () => {
    expect(matchIntent('')).toBeNull();
    expect(matchIntent('   ')).toBeNull();
  });

  it('devuelve null para input sin keywords conocidos', () => {
    const intent = matchIntent('xyzzy bla bla bla sin sentido');
    expect(intent).toBeNull();
  });

  it('ignora acentos (Normaliza antes de matchear)', () => {
    expect(matchIntent('¿Qué precio tiene?')?.kind).toBe('pricing');
    expect(matchIntent('¿Qué servicios ofrecen?')?.kind).toBe('services');
    expect(matchIntent('Información por favor')?.kind).toBeUndefined();
    // Pero "necesito información de servicios" sí matchea 'services':
    expect(matchIntent('necesito información de servicios')?.kind).toBe('services');
  });

  it('case-insensitive', () => {
    expect(matchIntent('HOLA')?.kind).toBe('greeting');
    expect(matchIntent('PreCiO')?.kind).toBe('pricing');
  });
});

describe('chatbot-responses · processInput', () => {
  it('input vacío devuelve unknown', () => {
    const r = processInput('');
    expect(r.response.kind).toBe('unknown');
    expect(r.sideEffect).toBeUndefined();
  });

  it('input "hola" devuelve greeting sin sideEffect', () => {
    const r = processInput('hola');
    expect(r.response.kind).toBe('greeting');
    expect(r.sideEffect).toBeUndefined();
  });

  it('/reset devuelve sideEffect=reset', () => {
    const r = processInput('/reset');
    expect(r.response.kind).toBe('reset');
    expect(r.sideEffect).toBe('reset');
  });

  it('/portalsignup devuelve sideEffect=redirect-portal-login', () => {
    const r = processInput('/portalsignup');
    expect(r.response.kind).toBe('portalsignup');
    expect(r.sideEffect).toBe('redirect-portal-login');
  });

  it('/help NO tiene sideEffect', () => {
    const r = processInput('/help');
    expect(r.response.kind).toBe('help');
    expect(r.sideEffect).toBeUndefined();
  });

  it('COMMAND_SIDE_EFFECTS mapa tiene los 3 commands', () => {
    expect(COMMAND_SIDE_EFFECTS['/reset']).toBe('reset');
    expect(COMMAND_SIDE_EFFECTS['/portalsignup']).toBe('redirect-portal-login');
  });
});

describe('chatbot-responses · INITIAL_GREETING', () => {
  it('INITIAL_GREETING_KIND es greeting', () => {
    expect(INITIAL_GREETING_KIND).toBe('greeting');
  });
  it('INITIAL_GREETING_KEY apunta a i18n', () => {
    expect(INITIAL_GREETING_KEY).toBe('chatbot.mock_greeting');
  });
});
