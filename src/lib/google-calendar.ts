// Integración con Google Calendar para crear la videollamada de la cita.
//
// Por qué no se usa el SDK `googleapis`: son ~15 MB de dependencias y este
// worker ya funciona con nodejs_compat. La API de Calendar se puede llamar
// directo por REST con un service account, que es el modelo correcto para un
// backend serverless que crea eventos en el calendario del operador.
//
// CONFIGURACIÓN (secretos del worker):
//   GOOGLE_CALENDAR_CLIENT_EMAIL  — service account
//   GOOGLE_CALENDAR_PRIVATE_KEY   — clave privada PEM (con \n literales)
//   GOOGLE_CALENDAR_ID            — id del calendario destino (primary o el
//                                   id del calendario de trabajo)
//   GOOGLE_CALENDAR_HOST          — opcional, default calendar.google.com
//
// Sin esas credenciales el módulo NO falla: `crearEventoMeet` devuelve null y
// la cita queda en estado 'pendiente' para que el operador confirme el enlace
// a mano desde /admin/citas. El cliente nunca ve un enlace de Meet roto.

export type CalendarEnv = {
  GOOGLE_CALENDAR_CLIENT_EMAIL?: string;
  GOOGLE_CALENDAR_PRIVATE_KEY?: string;
  GOOGLE_CALENDAR_ID?: string;
  GOOGLE_CALENDAR_HOST?: string;
};

export type EventoMeet = {
  /** URL de la videollamada (https://meet.google.com/xxx-xxxx-xxx). */
  meetUrl: string;
  /** Id del evento en Google Calendar. */
  eventId: string;
  /** Hora de inicio en epoch ms (UTC). */
  inicio: number;
};

const HOST_POR_DEFECTO = 'calendar.google.com';
const SCOPE_CALENDARIO = 'https://www.googleapis.com/auth/calendar';

/**
 * Indica si hay credenciales de Google Calendar configuradas.
 * La UI y el admin usan esto para mostrar "se creará el enlace automáticamente"
 * vs "el operador confirmará el enlace".
 */
export function calendarConfigurado(env: CalendarEnv): boolean {
  return Boolean(
    env.GOOGLE_CALENDAR_CLIENT_EMAIL &&
      env.GOOGLE_CALENDAR_PRIVATE_KEY &&
      env.GOOGLE_CALENDAR_ID
  );
}

/**
 * Crea un evento en el calendario con videollamada de Google Meet y devuelve
 * el enlace. Devuelve null si no hay credenciales o si la API falla — la cita
 * nunca se pierde por un fallo de calendario.
 */
export async function crearEventoMeet(
  env: CalendarEnv,
  params: {
    titulo: string;
    descripcion?: string;
    inicio: number;
    duracionMinutos: number;
    attendees?: Array<{ email: string; nombre?: string }>;
  }
): Promise<EventoMeet | null> {
  if (!calendarConfigurado(env)) return null;

  const host = env.GOOGLE_CALENDAR_HOST || HOST_POR_DEFECTO;
  const calendarId = env.GOOGLE_CALENDAR_ID as string;

  try {
    const token = await obtenerAccessToken(env, host);
    if (!token) return null;

    const fin = params.inicio + params.duracionMinutos * 60_000;

    const body = {
      summary: params.titulo,
      description: params.descripcion ?? '',
      start: { dateTime: new Date(params.inicio).toISOString() },
      end: { dateTime: new Date(fin).toISOString() },
      // conferenceData + conferenceDataVersion=1 es lo que hace que Google
      // cree la sala de Meet y devuelva el hangoutLink.
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      attendees: (params.attendees ?? []).map((a) => ({
        email: a.email,
        displayName: a.nombre,
      })),
    };

    const resp = await fetch(
      `https://${host}/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) {
      const detalle = await resp.text().catch(() => '');
      console.error('Google Calendar create event failed:', resp.status, detalle.slice(0, 300));
      return null;
    }

    const data = (await resp.json()) as {
      id?: string;
      hangoutLink?: string;
      conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
    };

    const meetUrl =
      data.hangoutLink ??
      data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri;

    if (!meetUrl) {
      console.error('Google Calendar event created without a Meet link:', data.id);
      return null;
    }

    return { meetUrl, eventId: data.id ?? '', inicio: params.inicio };
  } catch (err) {
    console.error('crearEventoMeet failed (non-blocking):', err);
    return null;
  }
}

/**
 * Pide un access token OAuth2 a Google usando el flujo de service account
 * (JWT firmado con RS256). Devuelve null si algo falla.
 */
async function obtenerAccessToken(env: CalendarEnv, host: string): Promise<string | null> {
  const clientEmail = env.GOOGLE_CALENDAR_CLIENT_EMAIL as string;
  const privateKey = (env.GOOGLE_CALENDAR_PRIVATE_KEY as string).replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPE_CALENDARIO,
      aud: `https://${host}/oauth2/v4/token`,
      iat: now,
      exp: now + 3600,
    })
  );

  const signature = await firmarRs256(`${header}.${claims}`, privateKey);
  if (!signature) return null;

  const assertion = `${header}.${claims}.${signature}`;

  const resp = await fetch(`https://${host}/oauth2/v4/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!resp.ok) {
    const detalle = await resp.text().catch(() => '');
    console.error('Google token request failed:', resp.status, detalle.slice(0, 300));
    return null;
  }

  const data = (await resp.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/** Firma un JWT con RS256 usando WebCrypto (disponible en Workers). */
async function firmarRs256(mensaje: string, privateKeyPem: string): Promise<string | null> {
  try {
    const pem = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s+/g, '');

    const bin = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'pkcs8',
      bin,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const firma = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(mensaje)
    );
    return b64urlBytes(new Uint8Array(firma));
  } catch (err) {
    console.error('RS256 signing failed:', err);
    return null;
  }
}

function b64url(input: string): string {
  return b64urlBytes(new TextEncoder().encode(input));
}

function b64urlBytes(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
