# Pricing research · agencias de desarrollo de software · 2026-09-24

Research mundial de tarifas de agencias de desarrollo de software. **Excluye OSINT y Testing** (acuerdo 2026-09-24). TRM usada: $3.100 COP/USD (Syncra, agosto 2026).

## Resumen ejecutivo

| Mercado | Tarifa hora USD (mid) | Tarifa hora COP (mid) | Tier de servicio |
|---------|----------------------:|----------------------:|------------------|
| 🇺🇸 USA (Silicon Valley) | $110–$160 | $341k–$496k | Premium enterprise |
| 🇬🇧 UK / 🇩🇪 Europa occ. | $85–$125 | $263k–$387k | Premium enterprise |
| 🇪🇺 Europa del Este | $42–$65 | $130k–$201k | Mid-tier |
| 🇧🇷 Brasil | $35–$55 | $108k–$170k | Mid-tier |
| 🇨🇴 **Colombia** | **$28–$45** | **$86k–$139k** | **Mid-tier LATAM** |
| 🇲🇽 México | $32–$50 | $99k–$155k | Mid-tier LATAM |
| 🇦🇷 Argentina | $25–$40 | $77k–$124k | Mid-tier LATAM |
| 🇮🇳 India | $20–$35 | $62k–$108k | Budget offshore |

Fuentes: getprojects.ai (2026), Talmatic (jul 2026), Offshore.dev (2026, n=6.655), Techreviewer (mar 2026, n=127), Globental (abr 2026).

## Hallazgo clave 1 — el mercado es bimodal

Offshore.dev (n=6.655 agencias):
- **62.1%** se anuncian en **$25–$49/hr**
- **29.7%** en **$50–$99/hr**
- Solo **4.7%** superan $100/hr
- Solo **1.6%** publican precios custom en su sitio web

> "Most companies advertise one of a handful of preset bands. The market doesn't price itself on a curve, it picks from a menu."

→ La batalla no es por la tarifa, es por **posicionamiento en una banda**.

## Hallazgo clave 2 — Colombia está exactamente en el sweet spot

- 44% de las 189 agencias colombianas se posicionan en $50+/hr (Offshore.dev)
- Pero el rango real mid-level es **$28–$45** (getprojects.ai)
- Senior full-stack Colombia: **$40–$60/hr**
- Tech lead: **$50–$72/hr**
- Argentina es más barato pero timezone +4h CET (peor con USA)
- México: pool más grande, fuerte en SaaS

> Si te posicionas en $50–$70/hr full-stack senior, estás en el **percentil 60–70 mundial**, sin ser caro para USA/EU pero capturando margen de LATAM.

## Hallazgo clave 3 — el mantenimiento es 15–25% del desarrollo anual

Syncra (Colombia, 2026): "Una práctica común en el mercado colombiano es cotizar solo el desarrollo inicial y dejar el mantenimiento fuera. Eso genera una sorpresa desagradable post-entrega."

→ Ofrecer retainer mensual desde el día 1. Es ingreso recurrente + reduce churn.

## Rangos del mercado colombiano 2026 (proyectos completos)

Syncra / MyTech Solutions / Edwsystem (agosto 2026):

| Tipo de proyecto | Rango USD | Rango COP | Plazo |
|------------------|-----------|-----------|-------|
| Landing / sitio corporativo | $600–$2.500 | $1,9M–$7,8M | 2–4 sem |
| Sistema interno básico | $3.000–$8.000 | $9,3M–$24,8M | 2–3 meses |
| App con facturación electrónica DIAN | $8.000–$22.000 | $24,8M–$68,2M | 3–5 meses |
| App móvil (iOS+Android) | $12.000–$30.000 | $37,2M–$93M | 4–7 meses |
| Plataforma SaaS / marketplace | $30.000–$90.000 | $93M–$279M | 6–12 meses |
| Enterprise multi-módulo | $90.000+ | $279M+ | 9–18 meses |

## Retainer / monthly tiers (3Innovative, Boffin Coders 2026)

| Tier | Rango USD/mes | Rango COP/mes | Incluye |
|------|---------------|---------------|---------|
| Growth Pod | $3.500–$6.000 | $10,8M–$18,6M | 1-2 devs + PM part-time |
| Dedicated Team | $8.000–$15.000 | $24,8M–$46,5M | 3-5 devs + tech lead |
| Fractional CTO | $4.000–$8.000 | $12,4M–$24,8M | 8-16h/sem advisory |

## Recomendación de pricing para NX-Studio

Basándome en tu perfil (LATAM, multi-stack, IA, demos reales en producción):

### Tarifa por hora (pública, en COP)

| Seniority | Tarifa COP/h | USD/h | Posicionamiento |
|-----------|--------------|-------|-----------------|
| Junior (poco usado) | $80.000–$100.000 | $26–$32 | Solo en retainer, no se publica |
| **Mid-level full-stack** | **$140.000–$180.000** | **$45–$58** | **Sweet spot, percentil 60 LATAM** |
| **Senior full-stack / IA** | **$200.000–$260.000** | **$65–$84** | **Tu zona, competitivo vs EU** |
| Tech lead / arquitecto | $280.000–$360.000 | $90–$116 | Premium, sparingly |

> Regla: **publicar siempre rangos, nunca tarifa exacta** (alineado con tu v0.3.0 del pricing engine — nunca publicar precio fijo).

### 3 tiers de proyecto fijo (los que publicas en `/cotizador`)

Inspirado en Syncra + Globental + tu motor de pricing actual de 18 features:

| Tier | Rango USD | Rango COP | Incluye | Para quién |
|------|-----------|-----------|---------|------------|
| **Starter** (MVP / landing / sitio) | $1.500–$5.000 | $4,6M–$15,5M | 1 dev, 2-4 sem, deploy, ss, handoff | Emprendedores, validación |
| **Standard** (SaaS / app a medida) | $8.000–$25.000 | $24,8M–$77,5M | 1-2 devs + PM part-time, 2-4 meses, auth, DB, integraciones básicas, deploy + CI/CD | PyMEs colombianas, MVPs complejos |
| **Growth** (plataforma / enterprise lite) | $30.000–$80.000 | $93M–$248M | Equipo completo + tech lead, 4-8 meses, arquitectura multi-tenant, integraciones avanzadas, observabilidad, retainer incluido | Empresas con inversión real |

### Retainer mensual (mantenimiento + evolución)

| Plan | COP/mes | USD/mes | Horas | Incluye |
|------|---------|---------|------:|---------|
| **Care** | $1.500.000 | ~$485 | 8 h | Bugfixes, seguridad, deploy, monitoring |
| **Evolve** | $3.500.000 | ~$1.130 | 20 h | Care + features nuevas, refinamiento UX |
| **Scale** | $7.500.000 | ~$$2.420 | 40 h | Evolve + dedicated tech lead, optimizaciones, A/B testing |

> Filtro: solo clientes con proyecto previo o SaaS propio del cliente.

## Cómo innovar sobre lo que hacen las agencias

1. **Pricing transparente por tier, no por hora** — 70% de las agencias no publican precios. Tú publicas 3 tiers con rangos. Te diferencia.
2. **Showcase con video/GIF obligatorio** — solo el 8% de las agencias tiene videos en su portafolio (los 6 tuyos listos ya te ponen adelante).
3. **IA como servicio, no como buzzword** — separar "IA" del precio base. Cobrar por capacidad (RAG, agentes, voice) como addon.
4. **Backend de tráfico con agentes IA** — es tu diferencial real vs el 95% de agencias. (Ver `ai-traffic-flow.md` para arquitectura.)
5. **Build-in-public** — mostrar proyectos WIP en `/laboratorio` con telemetría (Commits, deploys, uptime). Esto es el patrón de Sentry, Linear, Vercel.

## Lo que NO hacer (anti-patrones LATAM)

- ❌ Publicar tarifa hora exacta (te obliga a cotizar contra freelancers de $8/h).
- ❌ Cotizar "todo incluido" sin desglose (genera disputes, malentendidos).
- ❌ Dejar mantenimiento fuera del contrato (te mata el recurrente).
- ❌ Prometer "IA" sin casos de uso concretos (los clientes lo notan).
- ❌ Cobrar por hora en proyectos largos (incentivo perverso, penaliza tu seniority).

## Próximos pasos

1. Actualizar `src/data/pricing.ts` con estos rangos (3 tiers + 3 retainers).
2. Crear `/proyectos/[slug]` page template que muestre video + screenshots + tech badges.
3. Implementar `ai-traffic-flow.md` (lead capture agent) para automatizar calificación.
4. Política: publicar SIEMPRE los rangos en la landing, ocultar tarifa exacta hasta cotizar.

## Fuentes

- getprojects.ai — "Software Developer Hourly Rates by Country 2026" (ene 2026, n=amplia)
- Talmatic — "Software Developer Hourly Rate in 2026: $18–$150/hr by Country & Seniority" (jul 2026)
- Offshore.dev — "Offshore Software Development Rates 2026" (2026, n=6.655 agencias, 20 países)
- Techreviewer — "Software Development Company Rates in 2026" (mar 2026, encuesta a 127 proveedores)
- Globental — "How Much Does It Cost to Hire a Developer in Latin America? 2026" (abr 2026)
- Syncra — "¿Cuánto cuesta desarrollar software a medida en Colombia en 2026?" (ago 2026)
- MyTech Solutions — "Desarrollo de Software en Bogotá: Cuánto Cuesta 2026" (feb 2026)
- Edwsystem, Mutoestudio, Trio.dev, Boffin Coders, 3Innovative, Agitech (varios 2026)
