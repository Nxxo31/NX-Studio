# PROJECT.md — NX-Studio

> **Estado:** Activo | **Versión:** 0.2.0 — Sistema lava neon + Cotizador + Servicios especializados + Templates | **Stack:** Astro 7 + Tailwind v4 (vía @tailwindcss/vite)
>
> ## Visión General
>
> NX-Studio es el sitio web **empresarial** de Sebastian Velasco para posicionar la marca, captar leads B2B y mostrar capacidades técnicas avanzadas que lo diferencian en el mercado latinoamericano. Complementa al portafolio personal (`portafolio/`, Next.js) — el personal muestra el expertise individual, el empresarial posiciona la oferta.
>
> **Objetivo:** Sitio visualmente impactante con identidad lava neon naranja/rojiza, sistema de pricing engine por features (diferenciador backend clave), catálogo de proyectos reales y marketplace de templates comprables.

## Identidad de marca · Lava Neon

Paleta naranja/rojizo Matrix-style:
- `--lava-core: #ff4500` (primario)
- `--lava-edge: #ff6a00` (highlight)
- `--lava-deep: #8b0000` (sombras)
- `--bg-void: #0a0608` (fondo base con tinte rojizo)
- `--bg-ember: #14090c` (surface)
- `--text-primary: #f5e6d3` (texto cálido)

Geometría: bordes angulares con chamfers (clip-path), grid lines de fondo, scan-line animation opcional, monospace para números/códigos.

## Estructura de páginas

```
/
├── index                      # Home (Hero asimétrico, Servicios, Por qué NX-Studio, Proceso, LITA, Stack, Impacto)
├── /proceso                   # Metodología 5 fases
├── /precios                   # Engagement shapes + tiers
├── /contacto                  # Formulario WhatsApp + email
├── /laboratorio               # Chat IA + mockup Pollinations + preview cotizador
├── /cotizador                 # ★ Pricing engine por features (state local, tiempo real)
├── /servicios                 # Índice servicios especializados
│   ├── /osint                 # OSINT: due diligence, brand threat, leak monitoring
│   └── /testing               # QA/Testing: tiers Foundation/Accelerator/Strategic
├── /templates                 # Marketplace de templates comprables
│   └── /[slug]                # Detalle por template
├── /productos                 # Catálogo de 11 repos reales de Nxxo31
│   ├── /[slug]                # Detalle por proyecto (screenshots, sin videos aún)
│   └── /index
└── /docs                      # research-pricing-patterns.md (referencias internas)
```

## Servicios ofrecidos (actualizado 2026-09-14)

### Capacidades core
- Arquitectura de software a medida
- Desarrollo full-stack (web/mobile/PWA)
- IA aplicada (chatbots, RAG, agentes)
- Integraciones (Stripe, Resend, Twilio, OpenAI)
- Modernización de stacks legacy

### Servicios especializados (nuevos v0.2.0)
- **OSINT** — Investigación de fuentes abiertas (personas, empresas, marcas, dominios, dark web). Pricing role-based: Analyst $80/h, Senior $110/h, Specialist $140/h
- **Testing & QA** — Manual + automation, performance, accesibilidad WCAG 2.1 AA, security pen-testing. Tiers Foundation/Accelerator/Strategic con platform fee transparente

### Productos (nuevos v0.2.0)
- **Templates comprables** — Landing Converter $290, Dashboard Starter $590, Headless E-commerce $890. One-time payment, código MIT-licensed

## Pricing engine (diferenciador backend)

`src/data/pricing.ts` define:
- **18 features** organizadas en 5 categorías (core/design/backend/growth/ops)
- **4 engagement shapes**: fixed / retainer / dedicated / tm
- **3 modifiers**: rush +25%, bundle -10% (>80h), longterm -15% (≥12mo)
- **Cálculo**: `(sum(features) + baseFee) × multipliers` con rango ±15% (alineado industria: "no publicamos precio exacto")
- **Output**: banda Starter / Standard / Growth / Enterprise

UI con state local vanilla JS en `/cotizador`. No backend todavía — el cálculo es client-side.

## Research de patrones (referencias estructurales, no visuales)

`docs/research-pricing-patterns.md` documenta benchmarks de:
- **Vertex pricing engine** (base fee + transaction tiers + modules)
- **Toptal / Andela / Arc.dev** (engagement shapes: hourly/retainer/dedicated)
- **Smart Intelligence OSINT** (€80-160/hr role-based)
- **Oxint / THINKPOL** (intake rápido + scoping + fixed-fee)
- **OutpostQA / remote.qa / Appsierra** (QA tiers + managed pods)

Mantener identidad propia lava neon, NO copiar marca ni estilo visual de estos.

## Estado de implementación

| Fase | Descripción | Commit |
| | |
| Phase 0 | Foundation: Astro 7 + Tailwind v4 + estructura | (anterior) |
| Phase 1 | Hero asimétrico, Servicios, Proceso 5 fases, LITA, Stack, Impacto, Contact | `ac3128b` |
| Phase 2 | Catálogo productos (11 repos reales) | `77ce0b8` |
| Phase 3 | Laboratorio IA (chatbot + Pollinations) | `77ce0b8` |
| Phase 4 | Pricing engine + Servicios especializados + Templates | `5282fff` ★ |
| Phase 5 | (futuro) Backend real para cotizador, payments para templates, analytics | — |

## Sprint actual

**Sprint v0.2.0 — Pricing engine + Servicios especializados + Templates (completado)**

Tareas:
- [x] Research de patrones (docs/research-pricing-patterns.md)
- [x] Sistema de tokens lava neon (reemplaza púrpura/cian)
- [x] Pricing engine con 18 features, 4 shapes, 3 modifiers, cálculo en tiempo real
- [x] Página /cotizador con UI funcional y desglose completo
- [x] Páginas /servicios/osint y /servicios/testing
- [x] Página índice /servicios
- [x] Marketplace /templates con 3 productos
- [x] Detalle por template con includes/excludes
- [x] Preview del cotizador en /laboratorio
- [x] Build de producción: 25 páginas estáticas, exit 0
- [x] Smoke test todas las rutas: 15/15 HTTP 200

Resultado: build exit 0, 25 páginas, 15/15 rutas OK, cotizador funcional con state local.

## Stack técnico

| Capa | Tecnología | Versión |
| | | |
| Framework | Astro | 7.3.2 |
| Styling | Tailwind CSS (vía Vite plugin) | 4.3.3 |
| TypeScript | | 5.7 |
| Hosting | GitHub Pages | (base: /NX-Studio/) |
| Identity | Lava neon (palette naranja/rojizo + chamfers + scan lines) | v0.2.0 |

## Decisiones arquitectónicas

| Decisión | Elegida | Razón |
| | | |
| Framework | Astro 7 | SSG + islands, ideal para sitios con poco JS |
| Pricing engine | Client-side (state local vanilla JS) | Sin backend, cálculo instantáneo, deploy simple |
| Engagement shapes | 4 formas (fixed/retainer/dedicated/tm) | Patrón consistente en B2B dev shops |
| OSINT pricing | Role-based (analyst/senior/specialist) | Alineado con benchmarks Smart Intelligence |
| QA pricing | Tiers + platform fee separado | Transparencia (OutpostQA pattern) |
| Templates | One-time payment, MIT-licensed | Modelo Arc.dev marketplace |
| Identidad | Lava neon naranja/rojizo | Distintiva vs competencia púrpura/azul |

## Limitaciones conocidas

1. **Cotizador sin backend**: el cálculo es client-side. Para enviar cotizaciones reales habría que añadir un endpoint que persista.
2. **Templates sin payment real**: el botón de comprar redirige a `/contacto?topic=template&slug=X` — no hay Stripe checkout aún.
3. **OSINT sin intake form**: la página describe el servicio pero no tiene formulario de intake de 4h (Oxint pattern). Pendiente.
4. **Sin i18n**: solo ES. AGENTS.md menciona decisión pendiente (ES vs ES+EN).
5. **Catálogo sin videos**: videoUrl queda undefined en `catalog.ts` por ahora. Se llenará cuando proyectos estén finalizados.
6. **Sin tests automatizados**: build manual + smoke test con curl. Pendiente Playwright/Vitest.

## Pendientes operador

- Decidir si el cotizador necesita backend real (lead capture → CRM)
- Implementar Stripe checkout para templates
- Intake form para OSINT (4h response promise)
- Decidir i18n (ES vs ES+EN)
- Cuando los proyectos del portafolio estén finalizados, llenar `videoUrl` en catalog.ts

---

*Generado por SophIA — Sebastian Velasco's autonomous operating system*
*v0.2.0: 2026-09-14 — Sistema lava neon, pricing engine, OSINT/Testing, templates marketplace.*