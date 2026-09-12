# NX-Studio

Landing page + portafolio profesional para NX-Studio.

## Descripción

Sitio web de presentación para NX-Studio (desarrollo web/móvil/sistemas/automatización).
Fuente de contenido y estilo: `PORTFOLIO_CONCEPT.md`.

## Estado

- Fase: kickoff — entorno Hermes listo (MiniMax-M3 + MCPs activos).
- Código: sin inicializar (no hay src/, package.json, ni git init desde cero — sólo docs).

## Sprint Activo

**Sprint 0 — Setup + Brief**

1. Inicializar repositorio (`git init`, .gitignore, README).
2. Scaffolding web estático (HTML+CSS+JS vanilla o Astro/Vite; decidir).
3. Implementar landing page con las secciones del concept:
   Hero, Servicios, Por qué NX-Studio, Proceso, Stack, Testimonios, CTA/Contacto.
4. Formulario de contacto funcional (WhatsApp + email).
5. Deploy (Vercel/Netlify/Cloudflare) + dominio `nxstudio.dev`.

## Stack sugerido

- Astro + Tailwind + TypeScript (estáticos + fast).
- Playwright MCP para e2e + screenshots de progreso.
- Context7 para docs de Tailwind/Astro on-demand.
- GitHub MCP para PRs y versionado.
- dark-memory para specs de vibe-loop y decisiones.

## MCPs activos en esta sesión

dark-memory · playwright · context7 · github

## Keywords dark-memory rápidas

- "inicia sesión" → dark_memory_session_start
- "crea spec" → dark_memory_vibe_spec
- "entrega" → dark_memory_vibe_publish
- "revisa drift" → dark_memory_judge (eval_type: drift_judge)

## decisiones pendientes

- Framework: Astro vs Vite vanilla
- i18n: solo ES o ES+EN
- Formulario: Formspree, Resend, o backend propio
