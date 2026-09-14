import type { APIRoute } from 'astro';
import { z } from 'zod';
import { insertMockup, insertLog } from '../../lib/db';

export const prerender = false;

const schema = z.object({
  prompt: z.string().min(5).max(500),
  style: z.enum(['corporate', 'startup', 'ecommerce', 'osint', 'testing']).default('corporate'),
  paleta: z.enum(['lava', 'pulse', 'aurora', 'matrix']).default('lava'),
  licitacion_id: z.number().int().positive().optional().nullable(),
});

// Generador de mockup HTML basado en prompt + estilo
// Algoritmo generativo determinístico: extrae palabras clave del prompt,
// elige layout y secciones según estilo, inyecta HTML inline listo para preview.
function generarMockupHTML(prompt: string, style: string, paleta: string): string {
  const lower = prompt.toLowerCase();
  const palabras = lower.split(/\s+/).filter((w) => w.length > 3).slice(0, 12);

  const paletas: Record<string, { bg: string; surface: string; text: string; accent: string; accent2: string }> = {
    lava:   { bg: '#0a0608', surface: '#1f0a08', text: '#f5e6d3', accent: '#ff4500', accent2: '#ff6a00' },
    pulse:  { bg: '#0c0a1a', surface: '#1a1530', text: '#e6e3f5', accent: '#7c5cff', accent2: '#22d3ee' },
    aurora: { bg: '#061218', surface: '#0e2230', text: '#e0f5f5', accent: '#10b981', accent2: '#06b6d4' },
    matrix: { bg: '#000800', surface: '#0a1f0a', text: '#a8e6a0', accent: '#39ff14', accent2: '#00ff88' },
  };
  const p = paletas[paleta] || paletas.lava;

  const layouts: Record<string, { sections: string[]; cta: string; titulo: string }> = {
    corporate: {
      titulo: palabras[0] ? palabras[0].charAt(0).toUpperCase() + palabras[0].slice(1) : 'Plataforma',
      sections: ['Servicios', 'Equipo', 'Casos', 'Contacto'],
      cta: 'Agendar demo',
    },
    startup: {
      titulo: palabras[0] ? palabras[0].charAt(0).toUpperCase() + palabras[0].slice(1) : 'Producto',
      sections: ['Features', 'Pricing', 'FAQ'],
      cta: 'Empezar gratis',
    },
    ecommerce: {
      titulo: palabras[0] ? palabras[0].charAt(0).toUpperCase() + palabras[0].slice(1) : 'Tienda',
      sections: ['Catálogo', 'Categorías', 'Carrito', 'Envío'],
      cta: 'Comprar ahora',
    },
    osint: {
      titulo: 'Investigación OSINT',
      sections: ['Servicios', 'Casos', 'Compliance', 'Contacto'],
      cta: 'Assessment',
    },
    testing: {
      titulo: 'QA as a Service',
      sections: ['Tiers', 'Casos', 'Engineers', 'Contacto'],
      cta: 'Empezar sprint',
    },
  };
  const l = layouts[style] || layouts.corporate;

  const sectionsHtml = l.sections
    .map(
      (s, idx) => `
      <section style="padding:48px 24px; border-bottom:1px solid ${p.surface};">
        <div style="max-width:960px; margin:0 auto;">
          <div style="font-family:monospace; font-size:11px; color:${p.accent2}; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px;">// section-${idx + 1}</div>
          <h2 style="font-family:serif; font-size:36px; margin:0 0 16px; color:${p.text};">${s}</h2>
          <p style="color:${p.text}; opacity:0.7; max-width:640px; line-height:1.6;">
            Lorem ipsum ${palabras[idx % palabras.length] || 'placeholder'} dolor sit amet, consectetur adipiscing elit.
            Contenido generado a partir del prompt del cliente: "${prompt.slice(0, 60)}..."
          </p>
          <button style="margin-top:16px; padding:12px 24px; background:${p.accent}; color:${p.bg}; border:none; font-family:monospace; text-transform:uppercase; font-size:12px; cursor:pointer; clip-path:polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));">
            Ver más
          </button>
        </div>
      </section>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${l.titulo} · Preview</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, system-ui, sans-serif; background: ${p.bg}; color: ${p.text}; }
  nav { padding: 16px 24px; border-bottom: 1px solid ${p.surface}; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: ${p.bg}; z-index: 10; }
  nav .brand { font-family: serif; font-size: 20px; font-weight: 700; }
  nav ul { display: flex; gap: 24px; list-style: none; margin: 0; padding: 0; font-family: monospace; font-size: 12px; }
  nav ul a { color: ${p.text}; opacity: 0.7; text-decoration: none; }
  nav ul a:hover { color: ${p.accent}; opacity: 1; }
  .hero { padding: 96px 24px; text-align: center; background: radial-gradient(ellipse 80% 60% at 50% 0%, ${p.surface} 0%, ${p.bg} 70%); }
  .hero h1 { font-family: serif; font-size: clamp(36px, 6vw, 64px); margin: 0 0 24px; line-height: 1.1; }
  .hero p { max-width: 640px; margin: 0 auto 32px; opacity: 0.8; font-size: 18px; line-height: 1.6; }
  .badge { display: inline-block; padding: 6px 12px; font-family: monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; background: ${p.surface}; border-left: 3px solid ${p.accent}; margin-bottom: 24px; }
  .preview-meta { background: ${p.bg}; color: ${p.text}; padding: 16px 24px; border-top: 1px solid ${p.surface}; font-family: monospace; font-size: 11px; opacity: 0.6; text-align: center; }
</style>
</head>
<body>
  <nav>
    <span class="brand">${l.titulo}</span>
    <ul>
      ${l.sections.map((s) => `<li><a href="#sec-${s}">${s}</a></li>`).join('')}
    </ul>
  </nav>
  <header class="hero">
    <span class="badge">// preview generado por NX-Studio</span>
    <h1>${l.titulo}</h1>
    <p>${prompt.slice(0, 200)}</p>
    <button style="padding:14px 28px; background:${p.accent}; color:${p.bg}; border:none; font-family:monospace; text-transform:uppercase; font-size:13px; cursor:pointer; clip-path:polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));">
      ${l.cta}
    </button>
  </header>
  ${sectionsHtml}
  <div class="preview-meta">// mockup generado · prompt: "${prompt.slice(0, 80)}..." · paleta: ${paleta} · estilo: ${style}</div>
</body>
</html>`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const raw = await request.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ ok: false, error: 'validation_error', issues: parsed.error.flatten() }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }
    const data = parsed.data;
    const html = generarMockupHTML(data.prompt, data.style, data.paleta);

    const result = insertMockup.run({
      licitacion_id: data.licitacion_id || null,
      prompt: data.prompt,
      html_preview: html,
      style: data.style,
      paleta: data.paleta,
    });

    if (data.licitacion_id) {
      insertLog.run(data.licitacion_id, 'mockup_generado', `style=${data.style} paleta=${data.paleta}`);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        mockup_id: Number(result.lastInsertRowid),
        html,
        url: `/api/mockup/${result.lastInsertRowid}`,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (err) {
    console.error('[api/mockup] error:', err);
    return new Response(JSON.stringify({ ok: false, error: 'internal_error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export { generarMockupHTML };