# NX-Studio — Research Estratégico

> Fecha: 2026-09-13 · Fuentes: benchmark competitivo + pricing research global + metodología delivery

---

## 1. Benchmark competitivo

### 1.1 Vertrex (Neiva, referencia base)

Vertrex es un estudio de software boutique de Neiva con posicionamiento "anti-agencia tradicional" [1][2]. Su propuesta:

- **Hook emocional**: "El software no es un lujo. Es tu derecho a competir."
- **Cero riesgo**: prototipo visual interactivo gratuito sin compromiso
- **Catálogo productizado**: HotelPro, MotelPro, FiestPro (verticales hospitality y eventos)
- **Apps sociales pro-bono**: Zap (comunicación offline mesh), Opita Go (marketplace USCO)
- **Portafolio real con métricas**: 11+ proyectos activos, 2+ marcas, 450+ impacto comunitario
- **Portal de clientes + OS interno** ya operativos (dashboard, documentos, chat)

**Lección clave**: Vertrex combina productización local + gratis-capa-de-entrada (prototipo) + vertical SaaS. Es el competidor directo más cercano.

### 1.2 Kinetix Tech (Cali)

"Convertimos tus procesos en ventajas competitivas" [3].

- Híbrido SaaS + servicios: Kilele (ERP SGSS/PILA/DIAN/Nómina/POS)
- Stack tradicional PHP/Laravel + Filament
- **Siguiendo**: "No vendemos horas — vendemos resultados"
- 3.999 tests automatizados, CI verde (proyecta rigurosidad)
- Sectorizado: salud, seguridad social, logística, retail

### 1.3 Kyndra (LATAM)

Software + IA para empresas en LATAM [4].

- **Modelo suscripción desde el día 1**: "elimina el riesgo financiero"
- Partner network: comerciales sectoriales + Kyndra pone tecnología
- IA aplicada a casos de negocio (ej: agendamiento WhatsApp)
- Nicho claro: salud, belleza, servicios de cita

**Lección clave**: la suscripción elimina la objeción de inversión inicial y crea MRR desde el primer cliente.

### 1.4 Otras referencias

- **Wirvii SAS (Neiva)**: software propio (Wirvii360) + servicios a medida. Compite en tu misma ciudad [9].
- **MAUVAS (Manizales)**: full stack + MVPs en 2–4 semanas [6].
- **Infinity Innovation Labs**: portafolio amplio, procesos DIAN, e-commerce [5].
- **thoughtbot (referencia global)**: "buy 3 senior devs + designer for 2 weeks" modelo de consultoría embebida [17][18].

---

## 2. Modelos de negocio rentables (data 2026)

Fuentes: Cadence [11], Pharallax [12], KUMO [13], Brightcurios [14].

### Tabla comparativa de modelos

| Modelo | Margen bruto típico | Estabilidad | Escalabilidad | Estadio |
|---|---|---|---|---|
| **Hourly** | 20–30% | Alta | Baja | Año 0–1 |
| **Fixed-bid** | 30–50% | Media | Media | Año 0–2 |
| **Milestone** | 40–55% | Media | Media | Año 1–2 |
| **Retainer** | 45–65% | Alta | Media–Alta | Año 1–3 |
| **Productized** | 55–70% | Alta | Alta | Año 2+ |
| **Value-based** | 60–80% | Media | Alta | Año 3+ (requiere casos) |
| **SaaS** | 80–90% | Muy alta | Muy alta | Solo tras validación |

> Una agencia saludable en 2026 mantiene gross margin entre **45–65%**. Por debajo de 35% se está subprecificando o sobre-equipada. Por encima de 70% es productized o puro value [11].

### Patrón ganador: **Escalera Híbrida Progresiva**

```
FASE 1: Free → prototipo (14 días, $0) — lead magnet
FASE 2: Productized → MVP en 4 semanas ($4k–$8k) — cash inmediato
FASE 3: Retainer → post-launch ($1.5k–$3k/mes) — MRR
FASE 4: Value-based → proyectos enterprise ($20k+) — alto margen
```

Esto es exactamente el modelo que Vertrex ya ejecuta con su "Prototipo Gratuito" + catálogo HotelPro/MotelPro/FiestPro.

### La matemática del 60/70 + 20/30 [14]

Al convertir servicio → producto:
- **60–70% del outcome** al precio del **20–30% del servicio** = SaaS viable
- El 30–40% restante (custom, estrategia) queda en high-touch retainer

Ejemplo con cifras NX-Studio target:
- Servicio retainer: $4k/mes (100% outcome)
- Productized: $2k/mes (80% outcome)
- SaaS: $400/mes (60% outcome) ← autoservicio
- Free: prototipo/muestra → lead gen

### Caso real: agencia → microSaaS $1M+ ARR

Leaseleds (real estate): $5–6k setup website + $200–350/mes SaaS [16]. 70 clientes, churn <1%, $80k/mes total, $25k solo SaaS.

PixelCraft (web design): $540k/año con ±45% varianza → productized $1M ARR con ±3% varianza [15].

SplitTesting: productized CRO, 11x EBITDA exit (custom services: 2–4x) [15].

---

## 3. Metodología de entrega óptima para Hermes

> "Proyectos de 4–14 semanas con fixed scope + weekly demos" [13]

### 3.1 Shape Up (Basecamp) adaptado a Hermes

**Shape Up** es la metodología más compatible con agentes IA: fixed time (4 semanas), variable scope, entregables definidos, cero backlog [19].

```
CICLO DE 4 SEMANAS (hermes-powered):
├─ Semana 0 (pre):  SHAPING — Hermes investiga, redacta pitch
├─ Semana 1:        BUILD — Hermes ejecuta directo (code + docs)
├─ Semana 2:        BUILD — iteración, deploy staging
├─ Semana 3:        INTEGRATE — QA, pagos, onboarding
└─ Semana 4:        SHIP + COOL-DOWN — lanzar, documentar
```

**Por qué funciona con Hermes**:
- Fixed time → evita scope creep
- Variable scope → Hermes adapta
- Weekly demos → cliente ve progreso real
- Cool-down → espec 7 en dark-memory = trigger cool-down

### 3.2 Pipeline operativo diario con Hermes MCPs

```
┌─ GitHub ──────────────────────────────────────────┐
│  proyecto  →  spec (dark-memory vibe_spec)        │
│  → tareas (T1..T14)  →  commits atómicos          │
│                                                      │
│  Daily: Hermes corre 1 tarea → llama tools →     │
│  commitea → gh_pages build + deploy               │
│                                                      │
│  dark-memory: session_start → task → vibe_publish  │
└─────────────────────────────────────────────────────┘
```

---

## 4. Plan de implementación para NX-Studio

### Fase 1 — Ahora (esta semana)

1. **Rediseñar pricing en el sitio** — mostrar 3 tiers:
   - **Prototipo Gratuito** — mockup interactivo + roadmap, 0 compromiso
   - **MVP 4 Semanas** — producto funcional, precio cerrado: $4.000 USD
   - **Evolución Activa** — $997/mes — mejoras, monitoreo, support

2. **Agregar página "Cómo Trabajamos"** — explicar el ciclo 4-semanas: Shape → Build → Integrate → Ship + Cool-down

3. **Agregar meta-tags OG/SEO** — og:image específico por servicio

### Fase 2 — Próximo sprint

4. **Catálogo de productos** — emular Vertrex: CliniFlow, MercadoLocal, RutaÓptima como cards clicables con demo

5. **Integrar dark-memory** como backend de tu CRM de leads — cada submit del form → vibe_spec

6. **Portal cliente** — página `/portal` donde clientes ven su proyecto en tiempo real (Kanban de Hermes)

### Fase 3 — Escala

7. **i18n EN/ES** — Astro i18n routing, ES primero
8. **SaaS específico** — cuando tengas 3 clientes repetitivos del mismo vertical, convertir
9. **Partner network** — replicar Kyndra: tú tecnología, comerciales traen clientes sectoriales

---

## 5. Posicionamiento NX-Studio vs competencia

| Posición | Vertrex | NX-Studio debe ser |
|---|---|---|
| Mensaje | "El software es tu derecho" | **"El software que escala contigo"** |
| Precio | No público | Transparente en web (anti-objeción) |
| Prototipo | Gratis mockup | **Gratis + funcional en 72h** |
| Tecnología | Astro + vario | Astro + AI-native (Claude/GPT integrado) |
| Vertical | Hospitality, eventos | SaaS gestión + IA aplicada |
| Diferenciador | Local Neiva | LATAM nearshore + productizado global |

---

## Fuentes

1. https://vertrex-website-five.vercel.app — Vertrex homepage
2. https://vertrex-website-five.vercel.app/sobre-nosotros — Vertrex sobre-nosotros
3. https://kinetix-tech.com — Kinetix Tech Cali
4. https://kyndra.tech — Kyndra LATAM
5. https://infinityinnovationslabs.com — Infinity Innovation Labs
6. https://mauvas.com — MAUVAS Manizales
7. https://cetus.com.co/fabrica-de-software — Cetus fábrica Bogotá
8. https://agrozoolutions.com — Agrozoolutions agro
9. https://wirvii.com — Wirvii SAS Neiva
10. https://fusionsas.com — Fusión Ingeniería
11. https://cadence.withremote.ai/blog/dev-agency-pricing-models — Cadence pricing 2026
12. https://pharallax.ai/insights/agency-pricing-models — Pharallax
13. https://www.kumohq.co/blog/software-development-retainer-vs-fixed-price-agency-2026 — KUMO hybrid
14. https://brightcurios.com/agency-to-microsaas-pricing-playbook — 60/70+20/30 rule
15. https://nicholasharris.me/articles/how-splittesting-com-productized-cro-into-an-11x-exit — SplitTesting
16. https://first-mrr.com/study/leaseleds — Leaseleds SaaS híbrido
17. https://thoughtbot.com — thoughtbot
18. https://thoughtbot.com/playbook — thoughtbot playbook
19. https://basecamp.com/shapeup — Shape Up Basecamp
