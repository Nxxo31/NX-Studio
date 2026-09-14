# Research: patrones de pricing engine y modelos B2B para NX-Studio
*Fecha: 2026-09-14. Fuente: web_search (Toptal, Andela, Arc, Vertice, Smart Intelligence OSINT, OutpostQA, Vervali, remote.qa).*

## Patrones a aplicar (manteniendo identidad NX-Studio, no copiando marca)

### 1. Pricing engine por features (estructura cotizador)
Vertex usa un modelo **base fee + transaction tiers + módulos seleccionados**. Para NX-Studio, aplicamos un patrón equivalente:
- **Precio base** (kickoff / scoping) — siempre presente
- **Features seleccionables** con horas estimadas — el usuario marca/desmarca y ve el total en tiempo real
- **Modifiers**: urgencia (rush), bundle discount, retainer mensual vs proyecto fixed
- **Output**: rango indicativo en USD/LATAM, no precio fijo (alineado con industria: "no publicamos precio exacto")

### 2. Engagement shapes (4 modelos, no 1)
Patrón consistente en Toptal/Andela/OutpostQA/QA firms:
- **Per-sprint / Fixed** — alcance definido, precio fijo, ideal para releases puntuales
- **Monthly retainer** — equipo continuo, cuota mensual predecible
- **Dedicated team** — equipo exclusivo full-time para producto continuo
- **Hourly / T&M** — para OSINT e investigación donde el alcance evoluciona

NX-Studio debe ofrecer las 4 formas. El cotizador selecciona la shape.

### 3. OSINT como servicio
Benchmarking: Smart Intelligence (€80-160/hr role-based), Oxint (intake en 4h, scope por engagement), THINKPOL (flat-fee annual + sovereign on-prem). Patrones:
- **Pricing**: por horas role-based (analyst / senior / specialist) + complexity score 1-5 por dimensión
- **Onboarding**: assessment gratuito 20-30min + scoping sprint opcional (fijo pequeño, se acredita)
- **Términos**: 50% upfront fixed-fee, monthly post-payment T&M, retención 90 días
- **Ethical gate**: declinar trabajo si likelihood bajo o problemas legales

### 4. QA / Testing as a Service
Benchmarking: OutpostQA tiers (Foundation/Accelerator/Strategic), remote.qa managed pods ($8K-45K/mo), Appsierra. Patrones:
- **Tiers con outcomes**, no horas: Foundation = stability subscription, Accelerator = velocity + CI/CD, Strategic = enterprise + security + a11y
- **Platform fee separado** de seat licenses (transparencia)
- **Add-ons**: performance/load, security pen-testing, accessibility compliance
- **Trial**: scoping sprint fixed-fee, riesgo cero antes de retainer

### 5. Project templates comprables (producto nuevo)
Inspirado en: Arc.dev (plantillas + marketplace), Cadence (engagement semanal). Estructura:
- Cada template: nombre, slug, descripción corta, stack, **precio fijo**, **lo que incluye / no incluye**, **demo URL / screenshot**
- Categorías: Landing, Dashboard, E-commerce, SaaS starter, Auth boilerplate, Blog/CMS
- El usuario compra el template (one-time payment) + opcionalmente soporte de implementación

### 6. Catálogo de proyectos (sin videos por ahora)
Mantener la estructura actual de `src/data/catalog.ts` (11 repos reales). Los `videoUrl?` se llenarán cuando los proyectos estén finalizados. Por ahora: screenshot + repo link + descripción + impacto + stack + status (live/prototype/archived).

## Identidad visual (lava neon naranja/rojizo)
Estilo Matrix NX-Studio: grid lines, scan effects, monospace UI accents. Paleta:
- `--lava-core: #ff4500` (naranja primario)
- `--lava-edge: #ff6a00` (highlight)
- `--lava-deep: #8b0000` (sombra / acentos secundarios)
- `--lava-glow: rgba(255, 69, 0, 0.6)` (glow/shadow)
- `--bg-void: #0a0608` (fondo casi negro con tinte rojizo)
- `--bg-ember: #1a0a0a`
- `--text-primary: #f5e6d3`
- `--text-muted: #a89580`

Geometría: bordes angulares con chamfers (cortes diagonales), grid lines sutiles, scan line animation opcional, monospace para números/códigos.

## Servicios a añadir
- **OSINT** — investigación de fuentes abiertas (personas, empresas, marcas, dominios, redes)
- **Testing** — QA manual + automation, performance, accessibility (WCAG 2.1 AA), security pen-testing
- **Templates** — productos one-time-payment (landing/dashboard/e-commerce starters)
- **Cotizador por features** — diferenciador backend clave
