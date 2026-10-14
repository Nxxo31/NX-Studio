// Brutalist mockup renderer for the Lab (/laboratorio).
// Determinista, sin dependencias externas, sin keys, sin red. Renderiza un
// wireframe brutalista (lava + tinta + bordes duros) a partir de un spec
// derivado de las 5 respuestas del chat. Cada tipo (dashboard, landing,
// mobile, ecommerce, tool) produce un SVG con layout propio. Seeded
// variations = diferentes layouts para el mismo spec (botón Regenerar).
//
// Tokens consumidos via atributos `fill`/`stroke="var(--nx-...)"`. El SVG
// hereda el tema activo (brutal-dark / brutal-cream) sin re-render.

export type MockupType = 'dashboard' | 'landing' | 'mobile' | 'ecommerce' | 'tool';

export type MockupSpec = {
  type: MockupType;
  name: string;
  tagline: string;
  feel: 'minimalista' | 'colorido' | 'futurista' | 'organico';
  platform: 'web' | 'mobile' | 'desktop' | 'otro';
  user: string;
  problem: string;
  refs: string;
  variation: number;
};

const W = 720;
const H = 480;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

const seeded = (n: number) => Math.abs(Math.sin(n * 9301 + 49297) * 233280) % 1;

function header(name: string, section: string, variation: number): string {
  return `
    <rect x="0" y="0" width="${W}" height="44" fill="var(--nx-ink)" />
    <rect x="0" y="44" width="${W}" height="3" fill="var(--nx-primary)" />
    <text x="20" y="28" font-family="ui-monospace, monospace" font-size="13" font-weight="700" fill="var(--nx-bg)" letter-spacing="1.5">${esc(truncate(name.toUpperCase(), 22))}</text>
    <text x="${W - 20}" y="28" text-anchor="end" font-family="ui-monospace, monospace" font-size="11" fill="var(--nx-bg)" opacity="0.7">// ${esc(section)}</text>
    <circle cx="${W - 70}" cy="22" r="4" fill="var(--nx-primary)" />
  `;
}

function chrome(footer = 'mockup generado · brutalismo'): string {
  return `
    <text x="${W - 20}" y="${H - 16}" text-anchor="end" font-family="ui-monospace, monospace" font-size="9" fill="var(--nx-text-dim)">${esc(footer)}</text>
    <text x="20" y="${H - 16}" font-family="ui-monospace, monospace" font-size="9" fill="var(--nx-text-dim)">NX-STUDIO · LAB v0.7</text>
  `;
}

function card(x: number, y: number, w: number, h: number, accent = false): string {
  const stroke = accent ? 'var(--nx-primary)' : 'var(--nx-ink)';
  const sw = accent ? 3 : 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--nx-surface)" stroke="${stroke}" stroke-width="${sw}" />`;
}

function lavaBlock(x: number, y: number, w: number, h: number, text: string, size = 12): string {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--nx-primary)" stroke="var(--nx-ink)" stroke-width="2" />
    <text x="${x + w / 2}" y="${y + h / 2 + size / 3}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="${size}" font-weight="700" fill="var(--nx-text-on-primary)" letter-spacing="1.5">${esc(text.toUpperCase())}</text>
  `;
}

function labelText(x: number, y: number, text: string, size = 10, color = 'var(--nx-text-muted)'): string {
  return `<text x="${x}" y="${y}" font-family="ui-monospace, monospace" font-size="${size}" fill="${color}" letter-spacing="0.5">${esc(text.toUpperCase())}</text>`;
}

function valueText(x: number, y: number, text: string, size = 22, color = 'var(--nx-text)'): string {
  return `<text x="${x}" y="${y}" font-family="ui-monospace, monospace" font-size="${size}" font-weight="700" fill="${color}">${esc(text)}</text>`;
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
function renderDashboard(spec: MockupSpec): string {
  const v = spec.variation;
  const metric1 = seeded(v) * 9000;
  const metric2 = seeded(v + 1) * 400;
  const metric3 = seeded(v + 2) * 99;
  return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="var(--nx-bg)" />
    ${header(spec.name, 'dashboard', v)}
    <!-- sidebar -->
    <rect x="0" y="47" width="148" height="${H - 47}" fill="var(--nx-surface)" />
    <rect x="148" y="47" width="3" height="${H - 47}" fill="var(--nx-ink)" />
    ${labelText(20, 80, 'NAVEGACIÓN', 9)}
    ${['Inicio', spec.user.split(' ')[0] || 'Mi cuenta', 'Proyectos', 'Reportes', 'Ajustes'].map(
      (n, i) => `
        <rect x="14" y="${100 + i * 44}" width="120" height="34" fill="${i === 0 ? 'var(--nx-primary)' : 'var(--nx-bg)'}" stroke="var(--nx-ink)" stroke-width="2" />
        <text x="74" y="${122 + i * 44}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="11" font-weight="700" fill="${i === 0 ? 'var(--nx-text-on-primary)' : 'var(--nx-text)'}" letter-spacing="0.5">${esc(n.toUpperCase())}</text>
      `,
    ).join('')}
    <!-- main -->
    ${labelText(170, 84, '// RESUMEN', 10, 'var(--nx-text-dim)')}
    ${valueText(170, 116, spec.tagline || 'Vista general', 20)}
    <!-- metric cards -->
    ${card(170, 140, 170, 100, v % 2 === 0)}
    ${labelText(184, 164, 'INGRESOS · MES', 9)}
    ${valueText(184, 198, `$${Math.round(metric1).toLocaleString()}`)}
    ${labelText(184, 218, '+12.4% vs LM', 9, 'var(--nx-success)')}
    ${card(350, 140, 170, 100, true)}
    ${labelText(364, 164, 'USUARIOS ACTIVOS', 9)}
    ${valueText(364, 198, Math.round(metric2).toLocaleString())}
    ${labelText(364, 218, '+3.1% esta sem', 9, 'var(--nx-success)')}
    ${card(530, 140, 170, 100, false)}
    ${labelText(544, 164, 'TASA · CONVERSION', 9)}
    ${valueText(544, 198, `${metric3.toFixed(1)}%`)}
    ${labelText(544, 218, 'meta 4.5%', 9, 'var(--nx-text-muted)')}
    <!-- chart-like row -->
    ${card(170, 256, 530, 130, false)}
    ${labelText(184, 280, '// ACTIVIDAD · 30 DÍAS', 9)}
    ${Array.from({ length: 30 }).map((_, i) => {
      const h = 12 + seeded(v + i) * 70;
      const x = 190 + i * 16;
      const y = 374 - h;
      const fill = i === 17 ? 'var(--nx-primary)' : 'var(--nx-ink)';
      return `<rect x="${x}" y="${y}" width="10" height="${h}" fill="${fill}" />`;
    }).join('')}
    ${lavaBlock(170, 402, 200, 40, 'Generar reporte', 12)}
    ${card(380, 402, 320, 40)}
    <text x="392" y="427" font-family="ui-monospace, monospace" font-size="11" fill="var(--nx-text-muted)">${esc(truncate('Última sync: hace 4 min · 2 alertas pendientes', 50))}</text>
    ${chrome()}
  `;
}

// ─── LANDING ───────────────────────────────────────────────────────────────
function renderLanding(spec: MockupSpec): string {
  const v = spec.variation;
  return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="var(--nx-bg)" />
    ${header(spec.name, 'landing', v)}
    <!-- hero -->
    ${card(20, 70, W - 40, 170, true)}
    ${labelText(40, 100, '// HERO', 10, 'var(--nx-text-on-primary)')}
    <text x="40" y="142" font-family="ui-monospace, monospace" font-size="28" font-weight="800" fill="var(--nx-text-on-primary)">${esc(truncate(spec.tagline || 'Tu próximo producto empieza aquí', 30))}</text>
    <text x="40" y="172" font-family="ui-monospace, monospace" font-size="12" fill="var(--nx-text-on-primary)" opacity="0.8">${esc(truncate(spec.problem, 60))}</text>
    ${lavaBlock(40, 196, 180, 32, 'Empezar', 12)}
    <rect x="232" y="196" width="160" height="32" fill="transparent" stroke="var(--nx-ink)" stroke-width="2" />
    <text x="312" y="217" text-anchor="middle" font-family="ui-monospace, monospace" font-size="11" font-weight="700" fill="var(--nx-text-on-primary)" letter-spacing="1.5">VER DEMO</text>
    <!-- 3 feature blocks -->
    ${['Velocidad brutal', 'Seguridad real', 'Cero basura'].map((t, i) => {
      const x = 20 + i * ((W - 60) / 3 + 10);
      const w = (W - 60) / 3;
      return `
        ${card(x, 260, w, 110, false)}
        <rect x="${x}" y="260" width="${w}" height="4" fill="${i === 1 ? 'var(--nx-primary)' : 'var(--nx-ink)'}" />
        ${labelText(x + 16, 290, `// FEATURA ${String(i + 1).padStart(2, '0')}`, 9)}
        <text x="${x + 16}" y="316" font-family="ui-monospace, monospace" font-size="14" font-weight="700" fill="var(--nx-text)">${esc(t.toUpperCase())}</text>
        <text x="${x + 16}" y="338" font-family="ui-monospace, monospace" font-size="10" fill="var(--nx-text-muted)">${esc(truncate(spec.refs || 'Implementación directa, sin capas de más.', 50))}</text>
      `;
    }).join('')}
    <!-- footer band -->
    <rect x="0" y="400" width="${W}" height="60" fill="var(--nx-ink)" />
    ${labelText(20, 426, 'PLATAFORMA', 9, 'var(--nx-text-dim)')}
    <text x="20" y="448" font-family="ui-monospace, monospace" font-size="14" font-weight="700" fill="var(--nx-bg)">${esc(spec.platform.toUpperCase())} · READY</text>
    ${chrome()}
  `;
}

// ─── MOBILE ────────────────────────────────────────────────────────────────
function renderMobile(spec: MockupSpec): string {
  const v = spec.variation;
  const px = 220;
  const py = 60;
  const pw = 280;
  const ph = H - 120;
  const cx = (W - pw) / 2;
  return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="var(--nx-bg)" />
    ${header(spec.name, 'mobile', v)}
    <!-- phone frame -->
    <rect x="${cx}" y="${py}" width="${pw}" height="${ph}" fill="var(--nx-surface)" stroke="var(--nx-ink)" stroke-width="4" />
    <!-- status bar -->
    <rect x="${cx}" y="${py}" width="${pw}" height="22" fill="var(--nx-ink)" />
    <text x="${cx + 12}" y="${py + 15}" font-family="ui-monospace, monospace" font-size="10" fill="var(--nx-bg)">9:41</text>
    <rect x="${cx + pw - 36}" y="${py + 8}" width="22" height="6" fill="var(--nx-primary)" />
    <!-- header -->
    <text x="${cx + 16}" y="${py + 56}" font-family="ui-monospace, monospace" font-size="20" font-weight="800" fill="var(--nx-text)">${esc(truncate(spec.name, 14))}</text>
    ${labelText(cx + 16, py + 74, spec.platform, 9)}
    <!-- hero card -->
    ${card(cx + 14, py + 92, pw - 28, 86, true)}
    <text x="${cx + 28}" y="${py + 122}" font-family="ui-monospace, monospace" font-size="14" font-weight="700" fill="var(--nx-text-on-primary)">${esc(truncate(spec.tagline, 24))}</text>
    <text x="${cx + 28}" y="${py + 144}" font-family="ui-monospace, monospace" font-size="9" fill="var(--nx-text-on-primary)" opacity="0.85">${esc(truncate(spec.problem, 50))}</text>
    ${lavaBlock(cx + 28, py + 154, 100, 18, 'Abrir', 9)}
    <!-- 2 content cards -->
    ${card(cx + 14, py + 192, (pw - 34) / 2, 78, false)}
    ${labelText(cx + 28, py + 214, 'HOY', 9)}
    <text x="${cx + 28}" y="${py + 240}" font-family="ui-monospace, monospace" font-size="18" font-weight="700" fill="var(--nx-text)">${(seeded(v) * 100).toFixed(0)}%</text>
    <text x="${cx + 28}" y="${py + 258}" font-family="ui-monospace, monospace" font-size="9" fill="var(--nx-text-muted)">PROGRESO</text>
    ${card(cx + 20 + (pw - 34) / 2, py + 192, (pw - 34) / 2, 78, false)}
    ${labelText(cx + 34 + (pw - 34) / 2, py + 214, 'RANKING', 9)}
    <text x="${cx + 34 + (pw - 34) / 2}" y="${py + 240}" font-family="ui-monospace, monospace" font-size="18" font-weight="700" fill="var(--nx-text)">#${Math.round(seeded(v + 1) * 999).toString().padStart(3, '0')}</text>
    <text x="${cx + 34 + (pw - 34) / 2}" y="${py + 258}" font-family="ui-monospace, monospace" font-size="9" fill="var(--nx-text-muted)">SEMANAL</text>
    <!-- list -->
    ${[0, 1, 2].map((i) => {
      const y = py + 282 + i * 36;
      return `
        <rect x="${cx + 14}" y="${y}" width="${pw - 28}" height="28" fill="var(--nx-bg)" stroke="var(--nx-ink)" stroke-width="1.5" />
        <rect x="${cx + 18}" y="${y + 6}" width="16" height="16" fill="${i === 1 ? 'var(--nx-primary)' : 'var(--nx-ink)'}" />
        <text x="${cx + 44}" y="${y + 19}" font-family="ui-monospace, monospace" font-size="10" fill="var(--nx-text)">${esc(['Ingresos', 'Actividad', 'Ajustes'][i])}</text>
      `;
    }).join('')}
    <!-- tab bar -->
    <rect x="${cx}" y="${py + ph - 30}" width="${pw}" height="30" fill="var(--nx-ink)" />
    ${['INICIO', 'BUSCAR', 'CREAR', 'PERFIL'].map((t, i) => `
      <text x="${cx + 18 + i * (pw / 4) + (pw / 8) - 8}" y="${py + ph - 10}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="9" font-weight="${i === 0 ? 700 : 400}" fill="${i === 0 ? 'var(--nx-primary)' : 'var(--nx-bg)'}">${t}</text>
    `).join('')}
    ${chrome()}
  `;
}

// ─── ECOMMERCE ─────────────────────────────────────────────────────────────
function renderEcommerce(spec: MockupSpec): string {
  const v = spec.variation;
  const products = [
    ['Camisa brutal', '$48'],
    ['Mochila lava', '$129'],
    ['Cuaderno A5',   '$18'],
    ['Botella NX',    '$32'],
    ['Sticker pack',  '$8'],
    ['Polera 100%',   '$55'],
  ];
  return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="var(--nx-bg)" />
    ${header(spec.name, 'tienda', v)}
    ${labelText(20, 76, '// DESTACADOS', 9)}
    ${valueText(20, 102, truncate(spec.tagline, 32), 18)}
    <!-- search bar -->
    ${card(20, 118, W - 40, 36, false)}
    <text x="36" y="142" font-family="ui-monospace, monospace" font-size="11" fill="var(--nx-text-muted)">buscar productos...</text>
    ${lavaBlock(W - 110, 120, 80, 32, 'Carrito · 2', 10)}
    <!-- product grid 3x2 -->
    ${products.map((p, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 20 + col * ((W - 60) / 3 + 10);
      const y = 176 + row * 132;
      const w = (W - 60) / 3;
      const h = 120;
      return `
        ${card(x, y, w, h, false)}
        <rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="60" fill="var(--nx-ink)" />
        <text x="${x + 12}" y="${y + 42}" font-family="ui-monospace, monospace" font-size="9" fill="var(--nx-bg)">[ IMG ]</text>
        ${labelText(x + 10, y + 84, p[0], 10, 'var(--nx-text)')}
        <text x="${x + 10}" y="${y + 102}" font-family="ui-monospace, monospace" font-size="14" font-weight="700" fill="var(--nx-primary)">${p[1]}</text>
        <rect x="${x + w - 32}" y="${y + h - 28}" width="22" height="18" fill="var(--nx-primary)" stroke="var(--nx-ink)" stroke-width="1.5" />
        <text x="${x + w - 21}" y="${y + h - 14}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="11" font-weight="700" fill="var(--nx-text-on-primary)">+</text>
      `;
    }).join('')}
    ${chrome()}
  `;
}

// ─── TOOL ──────────────────────────────────────────────────────────────────
function renderTool(spec: MockupSpec): string {
  const v = spec.variation;
  return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="var(--nx-bg)" />
    ${header(spec.name, 'herramienta', v)}
    ${labelText(20, 78, '// ENTRADA', 9)}
    ${card(20, 90, W - 40, 100, false)}
    <text x="36" y="118" font-family="ui-monospace, monospace" font-size="11" fill="var(--nx-text-dim)">${esc(truncate(spec.problem || 'Ingresa tu consulta...', 60))}</text>
    <rect x="36" y="130" width="${W - 80}" height="3" fill="var(--nx-ink)" opacity="0.4" />
    <rect x="36" y="148" width="${(W - 80) * 0.7}" height="3" fill="var(--nx-ink)" opacity="0.4" />
    <rect x="36" y="166" width="${(W - 80) * 0.45}" height="3" fill="var(--nx-ink)" opacity="0.4" />
    ${lavaBlock(20, 206, 140, 38, 'Ejecutar', 13)}
    ${card(180, 206, W - 220, 38, true)}
    <text x="196" y="231" font-family="ui-monospace, monospace" font-size="11" font-weight="700" fill="var(--nx-text-on-primary)">${esc(truncate(spec.refs || 'config: brutalismo-v0.7 · auto', 50))}</text>
    <!-- result -->
    ${labelText(20, 272, '// RESULTADO', 9)}
    ${card(20, 286, W - 40, 150, false)}
    <rect x="20" y="286" width="6" height="150" fill="var(--nx-primary)" />
    <text x="44" y="316" font-family="ui-monospace, monospace" font-size="14" font-weight="700" fill="var(--nx-text)">OK · 4 RESULTADOS</text>
    ${Array.from({ length: 4 }).map((_, i) => {
      const y = 342 + i * 22;
      return `
        <text x="44" y="${y}" font-family="ui-monospace, monospace" font-size="10" fill="var(--nx-text)">›</text>
        <text x="62" y="${y}" font-family="ui-monospace, monospace" font-size="10" fill="var(--nx-text-muted)">${esc(truncate(['hash: ' + (seeded(v + i) * 9999).toFixed(0), 'feature: ' + (spec.user.split(' ')[0] || 'core'), 'metric: +' + (seeded(v + i + 1) * 100).toFixed(0) + '%', 'deploy: ready'][i], 50))}</text>
      `;
    }).join('')}
    ${chrome()}
  `;
}

// ─── Entry point ───────────────────────────────────────────────────────────
export function renderMockup(spec: MockupSpec): string {
  let body: string;
  switch (spec.type) {
    case 'dashboard':  body = renderDashboard(spec); break;
    case 'landing':    body = renderLanding(spec); break;
    case 'mobile':     body = renderMobile(spec); break;
    case 'ecommerce':  body = renderEcommerce(spec); break;
    case 'tool':       body = renderTool(spec); break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges">${body}</svg>`;
}

export function classifyType(answers: string[]): MockupType {
  const text = answers.join(' ').toLowerCase();
  if (/\b(mobile|android|ios|app m[oó]vil|celular)\b/.test(text)) return 'mobile';
  if (/\b(tienda|shop|store|ecommerce|comercio|cat[áa]logo|productos?)\b/.test(text)) return 'ecommerce';
  if (/\b(dashboard|panel|admin|analytics|monitoreo|crm|reportes?|m[ée]tricas?)\b/.test(text)) return 'dashboard';
  if (/\b(landing|p[áa]gina|web site|sitio web|hero|marketing)\b/.test(text)) return 'landing';
  return 'tool';
}

export function buildSpec(answers: { q: string; a: string }[], variation = 0): MockupSpec {
  const user = answers[1]?.a?.split(/\.|,/)[0]?.trim() || 'usuario';
  const problem = answers[2]?.a?.split(/\.|,/)[0]?.trim() || 'tarea principal';
  const platformMatch = (answers[3]?.a || '').toLowerCase();
  const platform: MockupSpec['platform'] =
    /\b(mobile|android|ios|app)\b/.test(platformMatch) ? 'mobile' :
    /\bdesktop\b/.test(platformMatch) ? 'desktop' :
    /\bweb\b/.test(platformMatch) ? 'web' : 'web';
  const feelMatch = (answers[4]?.a || '').toLowerCase();
  const feel: MockupSpec['feel'] =
    /\b(colorido|divertido|j[úu]g|u[íi]l)\b/.test(feelMatch) ? 'colorido' :
    /\b(futurista|neon|tech|cibern[eé]t)\b/.test(feelMatch) ? 'futurista' :
    /\b(c[áa]lido|org[áa]nico|natural|madera)\b/.test(feelMatch) ? 'organico' : 'minimalista';
  const name = (answers[0]?.a || 'Mi producto').split(/[\s,]+/)[0].slice(0, 24) || 'Mi producto';
  const tagline = ((answers[0]?.a || 'Construye algo brutal').split(/\.|,/)[0] || '').slice(0, 40);
  const refs = answers[4]?.a?.slice(0, 60) || '';
  return {
    type: classifyType(answers.map((x) => x.a)),
    name,
    tagline,
    feel,
    platform,
    user,
    problem,
    refs,
    variation,
  };
}
