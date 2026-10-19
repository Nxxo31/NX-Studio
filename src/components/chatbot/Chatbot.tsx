"use client";

/**
 * Chatbot flotante — SophIA (Phase 6).
 *
 * Componente client-only React. Toda la lógica vive aquí:
 *   - FSM de estado (closed/minimized/open) persistido en localStorage
 *   - Render del panel, FAB, mensajes, input
 *   - Mock responses (sin backend) via src/lib/chatbot-responses.ts
 *   - Accesibilidad: role="dialog", aria-label, focus al textarea al abrir
 *   - i18n via el traductor pasado como prop (calculado en .astro wrapper)
 *
 * NO usar React state fuera de aquí. El wrapper .astro decide si montarlo
 * según el pathname (excluye /portal/*, /admin/*, /api/*) — eso evita
 * que React se hidrate en páginas internas (memo: phase6).
 */

import * as React from "react";
import {
  CHATBOT_EXCLUDED_PREFIXES,
  CURRENT_SCHEMA_VERSION,
  STORAGE_KEY,
  defaultStorage,
  isValidStorage,
  loadStorage,
  makeMessage,
  pushMessage,
  resetHistory,
  shouldRenderChatbot,
  transition,
  type ChatMessage,
  type ChatbotState,
  type ChatbotStorage,
} from "~/lib/chatbot-fsm";
import {
  INITIAL_GREETING_KEY,
  INITIAL_GREETING_KIND,
  processInput,
  type BotResponse,
} from "~/lib/chatbot-responses";

/** Tipo del traductor pasado desde el wrapper .astro. */
export type TFunction = (key: string) => string;

/** Strings pre-computadas del namespace chatbot (pasadas como prop
 *  serializable, no como función, porque astro-island serializa a JSON). */
export interface ChatbotStrings {
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  close: string;
  minimize: string;
  reset: string;
  open: string;
  fab_label: string;
  panel_label: string;
  help_text: string;
  reset_done: string;
  portalsignup: string;
  mock_greeting: string;
  mock_pricing: string;
  mock_handoff: string;
  mock_unknown: string;
  mock_services: string;
  mock_templates: string;
  mock_labs: string;
  mock_contact: string;
  mock_thanks: string;
  aria_user_message: string;
  aria_bot_message: string;
  status_online: string;
  empty_state: string;
  input_hint: string;
  footer_disclaimer: string;
}

interface ChatbotProps {
  /** Pathname actual (window.location.pathname). */
  pathname: string;
  /** Locale activo ('es' | 'en' | 'pt'). */
  locale: "es" | "en" | "pt";
  /** Strings i18n pre-computadas (serializables). */
  strings: ChatbotStrings;
  /** Storage key por-locale (opcional, default: STORAGE_KEY). */
  storageKey?: string;
}

/** UI states locales que NO viven en localStorage. */
type UIState =
  | { kind: "idle" }
  | { kind: "thinking" }
  | { kind: "redirecting"; target: string };

/** Formato de timestamp relativo (es/en/pt awareness vía Intl). */
function relativeTime(ts: number, locale: string): string {
  const diff = Date.now() - ts;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diff < 60_000) return rtf.format(-Math.round(diff / 1000), "second");
  if (diff < 3_600_000) return rtf.format(-Math.round(diff / 60_000), "minute");
  if (diff < 86_400_000) return rtf.format(-Math.round(diff / 3_600_000), "hour");
  return rtf.format(-Math.round(diff / 86_400_000), "day");
}

/** Genera un "thinking delay" simulado (300-700ms) para que el bot se sienta humano. */
function thinkingDelay(): number {
  return 300 + Math.floor(Math.random() * 400);
}

/** Persiste storage en localStorage con fallback seguro. */
function persist(storage: ChatbotStorage, key: string): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(storage));
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — degradamos
    // gracefully: el chatbot sigue funcionando en memoria durante la sesión.
  }
}

/** Lee storage de localStorage con fallback. */
function read(key: string): ChatbotStorage {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultStorage();
    const parsed: unknown = JSON.parse(raw);
    return loadStorage(parsed);
  } catch {
    return defaultStorage();
  }
}

/** URL absoluta al portal de login (relativa al origin actual). */
function portalLoginUrl(): string {
  return "/portal/login";
}

/** SVG inline icons (no emojis, per spec). */
const IconChat = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconMinimize = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const IconSophia = ({ size = 28 }: { size?: number }) => (
  // Logo hexagonal mini + "S" — representación visual del asistente.
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" fill="currentColor" opacity="0.15" />
    <path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <text x="16" y="22" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor" fontFamily="system-ui, sans-serif">S</text>
  </svg>
);

/** Hook para autofocus + scroll management. */
function useAutoScroll(deps: ReadonlyArray<unknown>) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/** Hook para guardar y restaurar foco al abrir. */
function useFocusOnOpen(open: boolean, targetRef: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      targetRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [open, targetRef]);
}

/** Avatar del usuario (inicial en círculo). */
function UserAvatar({ name }: { name: string }) {
  const initial = (name || "Tú").trim().charAt(0).toUpperCase() || "T";
  return (
    <div
      className="nx-cb-avatar nx-cb-avatar-user"
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export default function Chatbot({ pathname, locale, strings, storageKey = STORAGE_KEY }: ChatbotProps) {
  // Helper local: lookup simple del dict de strings.
  // Las keys vienen como `chatbot.title` (con prefijo) o `title` (sin).
  // Soportamos ambos porque INITIAL_GREETING_KEY viene con prefijo.
  const t = React.useCallback(
    (key: string): string => {
      const stripped = key.startsWith("chatbot.") ? key.slice("chatbot.".length) : key;
      const value = (strings as unknown as Record<string, string | undefined>)[stripped];
      return value ?? key;
    },
    [strings],
  );

  // ── Guards ────────────────────────────────────────────────────────────────
  // Doble check (el .astro wrapper ya filtra pathname; aquí defendemos contra
  // un wrapper que olvidó el filtro).
  if (!shouldRenderChatbot(pathname)) {
    return null;
  }

  const isMountedRef = React.useRef(false);
  const storageRef = React.useRef<ChatbotStorage>(defaultStorage());
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fabRef = React.useRef<HTMLButtonElement | null>(null);
  const scrollerRef = useAutoScroll([storageRef.current.history.length, storageRef.current.state]);

  // ── FSM state (reacciona a storage) ────────────────────────────────────────
  const [state, setStateRaw] = React.useState<ChatbotState>("closed");
  const [history, setHistory] = React.useState<ChatMessage[]>([]);
  const [ui, setUI] = React.useState<UIState>({ kind: "idle" });
  const [input, setInput] = React.useState("");
  const [, forceTick] = React.useReducer((x: number) => x + 1, 0);

  // ── Mount: cargar storage y sembrar greeting si aplica ────────────────────
  React.useEffect(() => {
    isMountedRef.current = true;
    const loaded = read(storageKey);
    storageRef.current = loaded;
    setStateRaw(loaded.state);
    setHistory(loaded.history);
    // Sembrar greeting inicial si el history está vacío.
    if (loaded.history.length === 0) {
      const greeting = makeMessage(
        "bot",
        t(INITIAL_GREETING_KEY),
        Date.now(),
      );
      const next = pushMessage(loaded, greeting);
      storageRef.current = next;
      setHistory(next.history);
      persist(next, storageKey);
    }
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // ── Persistir cada cambio de estado ───────────────────────────────────────
  React.useEffect(() => {
    if (!isMountedRef.current) return;
    const next: ChatbotStorage = {
      ...storageRef.current,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      state,
      history,
      lastUpdatedAt: Date.now(),
    };
    storageRef.current = next;
    persist(next, storageKey);
  }, [state, history, storageKey]);

  // ── Re-render cada minuto para timestamps relativos frescos ──────────────
  React.useEffect(() => {
    const id = window.setInterval(() => forceTick(), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // ── Focus management ──────────────────────────────────────────────────────
  useFocusOnOpen(state === "open", textareaRef);

  // ── ESC cierra el panel cuando está abierto ───────────────────────────────
  React.useEffect(() => {
    if (state !== "open") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setStateRaw((s) => transition(s, "closed"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const open = React.useCallback(() => {
    setStateRaw((s) => transition(s, "open"));
  }, []);

  const minimize = React.useCallback(() => {
    setStateRaw((s) => transition(s, "minimized"));
  }, []);

  const close = React.useCallback(() => {
    setStateRaw((s) => transition(s, "closed"));
    // Devolver foco al FAB para usuarios con teclado.
    window.setTimeout(() => fabRef.current?.focus(), 50);
  }, []);

  const doReset = React.useCallback(() => {
    const fresh = resetHistory(storageRef.current);
    // Re-sembrar greeting inmediatamente para que el panel no quede vacío.
    const greeting = makeMessage("bot", t(INITIAL_GREETING_KEY), Date.now());
    const next = pushMessage(fresh, greeting);
    storageRef.current = next;
    setHistory(next.history);
    setStateRaw("open");
  }, [t]);

  const send = React.useCallback(
    (rawText: string) => {
      const trimmed = rawText.trim();
      if (trimmed.length === 0) return;
      // 1) push user message
      const userMsg = makeMessage("user", trimmed, Date.now());
      let next = pushMessage(storageRef.current, userMsg);
      storageRef.current = next;
      setHistory(next.history);
      setInput("");
      setUI({ kind: "thinking" });

      // 2) compute bot response
      window.setTimeout(() => {
        if (!isMountedRef.current) return;
        const { response, sideEffect } = processInput(trimmed);
        // Side effects primero (comandos).
        if (sideEffect === "reset") {
          doReset();
          return;
        }
        if (sideEffect === "redirect-portal-login") {
          const target = portalLoginUrl();
          const botMsg = makeMessage("bot", t(response.contentKey), Date.now());
          next = pushMessage(storageRef.current, botMsg);
          storageRef.current = next;
          setHistory(next.history);
          setUI({ kind: "redirecting", target });
          // Pequeño delay para que el usuario vea el mensaje antes de redirigir.
          window.setTimeout(() => {
            window.location.href = target;
          }, 1200);
          return;
        }
        // Respuesta normal.
        const botMsg = makeMessage("bot", t(response.contentKey), Date.now());
        next = pushMessage(storageRef.current, botMsg);
        storageRef.current = next;
        setHistory(next.history);
        setUI({ kind: "idle" });
      }, thinkingDelay());
    },
    [doReset, t],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter envía; Shift+Enter nueva línea.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  // Si la FSM dice 'closed', solo mostrar FAB.
  if (state === "closed") {
    return (
      <div className="nx-cb-root" data-chatbot-state="closed" data-testid="chatbot-root">
        <button
          ref={fabRef}
          type="button"
          className="nx-cb-fab"
          onClick={open}
          aria-label={t("chatbot.fab_label")}
          data-testid="chatbot-fab"
        >
          <IconChat />
        </button>
      </div>
    );
  }

  // 'minimized' o 'open' → FAB + panel.
  return (
    <div className="nx-cb-root" data-chatbot-state={state} data-testid="chatbot-root">
      <button
        ref={fabRef}
        type="button"
        className="nx-cb-fab"
        onClick={() => {
          if (state === "minimized") setStateRaw("open");
          else close();
        }}
        aria-label={t(state === "minimized" ? "chatbot.open" : "chatbot.close")}
        aria-expanded={state === "open"}
        data-testid="chatbot-fab"
      >
        {state === "minimized" ? <IconChat /> : <IconClose />}
      </button>

      <div
        className="nx-cb-panel"
        role="dialog"
        aria-modal="false"
        aria-label={t("chatbot.panel_label")}
        data-testid="chatbot-panel"
        hidden={state === "minimized"}
      >
        {/* Header */}
        <div className="nx-cb-header" data-testid="chatbot-header">
          <div className="nx-cb-header-left">
            <IconSophia size={32} />
            <div>
              <div className="nx-cb-title">{t("chatbot.title")}</div>
              <div className="nx-cb-subtitle">
                <span className="nx-cb-status-dot" aria-hidden="true" />
                {t("chatbot.status_online")}
              </div>
            </div>
          </div>
          <div className="nx-cb-header-actions">
            <button
              type="button"
              className="nx-cb-icon-btn"
              onClick={minimize}
              aria-label={t("chatbot.minimize")}
              data-testid="chatbot-minimize"
              title={t("chatbot.minimize")}
            >
              <IconMinimize />
            </button>
            <button
              type="button"
              className="nx-cb-icon-btn"
              onClick={close}
              aria-label={t("chatbot.close")}
              data-testid="chatbot-close"
              title={t("chatbot.close")}
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className="nx-cb-body"
          ref={scrollerRef}
          data-testid="chatbot-body"
        >
          {history.length === 0 && (
            <div className="nx-cb-empty">{t("chatbot.empty_state")}</div>
          )}
          {history.map((msg, idx) => (
            <MessageBubble
              key={`${msg.timestamp}-${idx}`}
              msg={msg}
              userLabel={t("chatbot.aria_user_message")}
              botLabel={t("chatbot.aria_bot_message")}
              locale={locale}
            />
          ))}
          {ui.kind === "thinking" && (
            <div className="nx-cb-bubble nx-cb-bubble-bot nx-cb-typing" data-testid="chatbot-typing">
              <span className="nx-cb-dot" />
              <span className="nx-cb-dot" />
              <span className="nx-cb-dot" />
            </div>
          )}
          {ui.kind === "redirecting" && (
            <div className="nx-cb-redirect-note" data-testid="chatbot-redirecting">
              {t("chatbot.portalsignup")}
              <span className="nx-cb-redirect-target">→ {ui.target}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <form className="nx-cb-footer" onSubmit={onSubmit} data-testid="chatbot-form">
          <div className="nx-cb-input-row">
            <textarea
              ref={textareaRef}
              className="nx-cb-input"
              placeholder={t("chatbot.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDownTextarea}
              rows={2}
              maxLength={500}
              aria-label={t("chatbot.placeholder")}
              data-testid="chatbot-input"
              disabled={ui.kind === "thinking"}
            />
            <button
              type="submit"
              className="nx-cb-send"
              disabled={input.trim().length === 0 || ui.kind === "thinking"}
              aria-label={t("chatbot.send")}
              data-testid="chatbot-send"
              title={t("chatbot.send")}
            >
              <IconSend />
            </button>
          </div>
          <div className="nx-cb-hint-row">
            <span className="nx-cb-hint">{t("chatbot.input_hint")}</span>
            <button
              type="button"
              className="nx-cb-link-btn"
              onClick={doReset}
              data-testid="chatbot-reset"
              aria-label={t("chatbot.reset")}
            >
              {t("chatbot.reset")}
            </button>
          </div>
          <div className="nx-cb-disclaimer">{t("chatbot.footer_disclaimer")}</div>
        </form>
      </div>
    </div>
  );
}

/** Componente interno para una burbuja de mensaje. */
function MessageBubble({
  msg,
  userLabel,
  botLabel,
  locale,
}: {
  msg: ChatMessage;
  userLabel: string;
  botLabel: string;
  locale: string;
}) {
  const isUser = msg.role === "user";
  return (
    <div
      className={`nx-cb-msg ${isUser ? "nx-cb-msg-user" : "nx-cb-msg-bot"}`}
      data-testid={isUser ? "chatbot-msg-user" : "chatbot-msg-bot"}
      role="listitem"
    >
      {!isUser && (
        <div className="nx-cb-avatar nx-cb-avatar-bot" aria-hidden="true">
          <IconSophia size={20} />
        </div>
      )}
      <div className="nx-cb-bubble-wrap">
        <div
          className={`nx-cb-bubble ${isUser ? "nx-cb-bubble-user" : "nx-cb-bubble-bot"}`}
          aria-label={isUser ? userLabel : botLabel}
        >
          {msg.content}
        </div>
        <time
          className="nx-cb-timestamp"
          dateTime={new Date(msg.timestamp).toISOString()}
          title={new Date(msg.timestamp).toLocaleString(locale)}
        >
          {relativeTime(msg.timestamp, locale)}
        </time>
      </div>
      {isUser && <UserAvatar name="" />}
    </div>
  );
}

/** Re-exporta helpers usados por el wrapper .astro si necesita lógica. */
export { shouldRenderChatbot, CHATBOT_EXCLUDED_PREFIXES, isValidStorage };

/** Tipo público del BotResponse para consumidores. */
export type { BotResponse };
