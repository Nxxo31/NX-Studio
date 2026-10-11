import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleLicitacionSubmit,
  licitacionSchema,
} from '~/server/licitacion-handler';
import { fakeD1, applyMigrations } from '../helpers/d1-fake';
import { createDb } from '~/db';
import { licitacion as licitacionTable } from '~/db/schema';
import { createEmailService } from '~/lib/email';

async function setup() {
  const d1 = fakeD1();
  await applyMigrations(d1);
  const db = createDb(d1);
  const emailsSent: Array<{ to: string; subject: string; html: string }> = [];
  const email = {
    send: async (msg: { to: string; subject: string; html: string }) => {
      emailsSent.push(msg);
    },
  };
  const env = {
    DB: d1,
    BETTER_AUTH_SECRET: 'test-secret-must-be-32-chars-or-more-for-real-use',
    BETTER_AUTH_URL: 'http://127.0.0.1:4321',
  };
  return { d1, db, email, emailsSent, env };
}

const validBody = {
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  empresa: 'Acme SA',
  telefono: '+57 300 1234567',
  pais: 'CO',
  tipo: 'webapp' as const,
  engagement: 'fixed' as const,
  urgencia: 'normal' as const,
  features: ['discovery', 'auth', 'api'],
  descripcion: 'Necesito una app web con auth y dashboard básico para mi negocio de logística.',
};

describe('licitacion-handler · schema Zod', () => {
  it('acepta un body completo y válido', () => {
    const parsed = licitacionSchema.safeParse(validBody);
    expect(parsed.success).toBe(true);
  });

  it('rechaza descripcion < 20 chars', () => {
    const parsed = licitacionSchema.safeParse({ ...validBody, descripcion: 'corto' });
    expect(parsed.success).toBe(false);
  });

  it('rechaza email inválido', () => {
    const parsed = licitacionSchema.safeParse({ ...validBody, email: 'no-es-email' });
    expect(parsed.success).toBe(false);
  });

  it('rechaza tipo fuera del enum', () => {
    const parsed = licitacionSchema.safeParse({ ...validBody, tipo: 'osint' });
    expect(parsed.success).toBe(false);
  });

  it('hace default urgencia=normal cuando falta', () => {
    const body = { ...validBody };
    delete (body as Record<string, unknown>).urgencia;
    const parsed = licitacionSchema.safeParse(body);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.urgencia).toBe('normal');
  });

  it('hace default features=[] cuando falta', () => {
    const body = { ...validBody };
    delete (body as Record<string, unknown>).features;
    const parsed = licitacionSchema.safeParse(body);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.features).toEqual([]);
  });
});

describe('licitacion-handler · submit flow', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;

  beforeEach(async () => {
    ctx = await setup();
  });

  it('submit válido persiste en DB y devuelve ok=true', async () => {
    const req = new Request('http://127.0.0.1:4321/api/licitacion', { method: 'POST' });
    const result = await handleLicitacionSubmit(validBody, req, {
      db: ctx.db,
      email: ctx.email,
      contactEmail: 'ops@nxstudio.dev',
      authEnv: ctx.env,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.licitacion_id).toMatch(/^[0-9a-f-]{36}$/i); // UUID
      expect(result.cotizacion.band).toMatch(/^(Starter|Standard|Growth|Enterprise)$/);
      expect(result.cotizacion.total_low).toBeGreaterThan(0);
      expect(result.cotizacion.total_high).toBeGreaterThan(result.cotizacion.total_low);
      expect(result.next_steps).toHaveLength(3);
    }

    // Verificar que se persistió
    const rows = await ctx.db.select().from(licitacionTable);
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('juan@example.com');
    expect(rows[0].status).toBe('nueva');
  });

  it('envía UN email al operador con los datos correctos', async () => {
    const req = new Request('http://127.0.0.1:4321/api/licitacion', { method: 'POST' });
    await handleLicitacionSubmit(validBody, req, {
      db: ctx.db,
      email: ctx.email,
      contactEmail: 'ops@nxstudio.dev',
      authEnv: ctx.env,
    });

    expect(ctx.emailsSent).toHaveLength(1);
    expect(ctx.emailsSent[0].to).toBe('ops@nxstudio.dev');
    expect(ctx.emailsSent[0].subject).toContain('Juan Pérez');
    expect(ctx.emailsSent[0].html).toContain('juan@example.com');
    expect(ctx.emailsSent[0].html).toContain('Acme SA');
  });

  it('submit con honeypot devuelve spam_detected y NO persiste', async () => {
    const result = await handleLicitacionSubmit(
      { ...validBody, honeypot: 'i-am-a-bot' },
      new Request('http://127.0.0.1:4321/api/licitacion'),
      { db: ctx.db, email: ctx.email, contactEmail: 'ops@nxstudio.dev', authEnv: ctx.env }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('spam_detected');

    const rows = await ctx.db.select().from(licitacionTable);
    expect(rows).toHaveLength(0);
    expect(ctx.emailsSent).toHaveLength(0);
  });

  it('submit con body inválido devuelve validation y NO persiste', async () => {
    const result = await handleLicitacionSubmit(
      { ...validBody, descripcion: 'corto' },
      new Request('http://127.0.0.1:4321/api/licitacion'),
      { db: ctx.db, email: ctx.email, contactEmail: 'ops@nxstudio.dev', authEnv: ctx.env }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('validation');

    const rows = await ctx.db.select().from(licitacionTable);
    expect(rows).toHaveLength(0);
  });

  it('submit sin user_id si no hay sesión', async () => {
    const req = new Request('http://127.0.0.1:4321/api/licitacion'); // sin cookies
    const result = await handleLicitacionSubmit(validBody, req, {
      db: ctx.db,
      email: ctx.email,
      contactEmail: 'ops@nxstudio.dev',
      authEnv: ctx.env,
    });
    expect(result.ok).toBe(true);

    const rows = await ctx.db.select().from(licitacionTable);
    expect(rows[0].userId).toBeNull();
  });

  it('submit con sesión válida vincula user_id a la licitacion', async () => {
    // Primero creamos un user
    const authMod = await import('~/lib/auth');
    const auth = authMod.createAuth(ctx.env);
    await auth.api.signUpEmail({
      body: { name: 'Cliente', email: 'cliente@example.com', password: 'supersecret123' },
    });
    // Luego hacemos sign in para obtener cookie
    const signInRes = await auth.api.signInEmail({
      body: { email: 'cliente@example.com', password: 'supersecret123' },
    });
    // El signIn programático puede no setear cookie — usamos el HTTP handler
    void signInRes;
    const signInHttpRes = await auth.handler(
      new Request('http://127.0.0.1:4321/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'cliente@example.com', password: 'supersecret123' }),
      })
    );
    const setCookie = signInHttpRes.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();

    // Submit con esa cookie
    const req = new Request('http://127.0.0.1:4321/api/licitacion', {
      method: 'POST',
      headers: { cookie: setCookie ?? '' },
    });
    const result = await handleLicitacionSubmit(validBody, req, {
      db: ctx.db,
      email: ctx.email,
      contactEmail: 'ops@nxstudio.dev',
      authEnv: ctx.env,
    });
    expect(result.ok).toBe(true);

    const rows = await ctx.db.select().from(licitacionTable);
    expect(rows[0].userId).toBeTruthy();
    // better-auth genera IDs tipicamente opacos (no UUID strict). Aceptamos
    // tanto UUIDs como ids de better-auth.
    expect(rows[0].userId).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
  });

  it('submit funciona aunque email service lance excepción', async () => {
    const failingEmail = {
      send: async () => {
        throw new Error('SMTP down');
      },
    };
    const req = new Request('http://127.0.0.1:4321/api/licitacion', { method: 'POST' });
    const result = await handleLicitacionSubmit(validBody, req, {
      db: ctx.db,
      email: failingEmail,
      contactEmail: 'ops@nxstudio.dev',
      authEnv: ctx.env,
    });
    expect(result.ok).toBe(true); // email no debe romper el submit

    // Y debe haberse persistido igual
    const rows = await ctx.db.select().from(licitacionTable);
    expect(rows).toHaveLength(1);
  });

  it('escapeHtml en email previene XSS básico', async () => {
    const req = new Request('http://127.0.0.1:4321/api/licitacion', { method: 'POST' });
    await handleLicitacionSubmit(
      { ...validBody, nombre: '<script>alert(1)</script>', empresa: '"onclick=alert(2)' },
      req,
      { db: ctx.db, email: ctx.email, contactEmail: 'ops@nxstudio.dev', authEnv: ctx.env }
    );
    const html = ctx.emailsSent[0].html;
    // Los caracteres deben estar escapados como entidades HTML
    expect(html).toContain(String.fromCharCode(38) + 'lt' + String.fromCharCode(59) + 'script');
    expect(html).toContain(String.fromCharCode(38) + 'quot' + String.fromCharCode(59) + 'onclick');
    // El script NO debe aparecer sin escapar
    const unescaped = String.fromCharCode(60) + 'scr' + 'ipt' + String.fromCharCode(62);
    expect(html).not.toContain(unescaped);
  });
});

describe('createEmailService (mock mode)', () => {
  it('devuelve mock service si no hay apiKey', () => {
    const svc = createEmailService({ apiKey: '', defaultFrom: 'a@b.com' });
    expect(typeof svc.send).toBe('function');
    // No debe lanzar
    void svc.send({ to: 'x@y.com', subject: 's', html: '<p>h</p>' });
  });
});
