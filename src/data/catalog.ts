// Catálogo de productos basado en repos reales de Nxxo31
// Cada proyecto se mapea a un producto con video demo embebido (YouTube/Vimeo) o screenshot

export type Project = {
  slug: string;
  code: string;
  name: string;
  tagline: string;
  desc: string;
  category: 'SaaS' | 'IA' | 'DevTools' | 'Seguridad' | '3D' | 'Web' | 'Backend';
  stack: string[];
  repo: string;
  demoUrl?: string;
  videoUrl?: string;
  image?: string;
  impact: string;
  year: string;
  status: 'live' | 'prototype' | 'archived';
};

export const projects: Project[] = [
  {
    slug: 'synthetic-trader',
    code: 'SYN',
    name: 'Synthetic Trader',
    tagline: 'SaaS para bots de trading algorítmico',
    desc: 'Plataforma para desplegar, monitorear y gestionar bots de trading algorítmico sobre índices sintéticos Deriv y otros mercados. Backend multi-tenant con métricas en tiempo real.',
    category: 'SaaS',
    stack: ['Node.js', 'Deriv API', 'WebSocket', 'PostgreSQL', 'Docker'],
    repo: 'https://github.com/Nxxo31/synthetic-trader',
    impact: 'Multi-mercado · Real-time',
    year: '2026',
    status: 'live',
  },
  {
    slug: 'nexocore',
    code: 'NXC',
    name: 'NexoCore',
    tagline: 'ERP/CRM/Analytics multi-tenant para PYMEs',
    desc: 'Plataforma SaaS multi-tenant que combina ERP ligero, CRM y analytics en un solo panel. Diseñada para PYMEs latinoamericanas con módulos de facturación, inventario y reportes.',
    category: 'SaaS',
    stack: ['Next.js 15', 'Prisma', 'TypeScript', 'PostgreSQL'],
    repo: 'https://github.com/Nxxo31/nexocore',
    impact: 'Multi-tenant · Analytics',
    year: '2026',
    status: 'live',
  },
  {
    slug: 'e14-fraud-detector',
    code: 'E14',
    name: 'E14 Fraud Detector',
    tagline: 'Auditoría forense de actas electorales',
    desc: 'Auditoría forense de actas electorales E-14 de Colombia. Procesa PDFs, extrae datos con OCR, valida coherencia entre mesas y detecta patrones de fraude estadístico.',
    category: 'IA',
    stack: ['Python', 'OCR', 'Pandas', 'Estadística', 'FastAPI'],
    repo: 'https://github.com/Nxxo31/e14-fraud-detector',
    impact: 'Transparencia democrática',
    year: '2026',
    status: 'live',
  },
  {
    slug: 'nva-demons',
    code: 'NVA',
    name: 'Tatacoa NVA Demons',
    tagline: 'Visualización 3D inmersiva del Desierto de la Tatacoa',
    desc: 'Experiencia 3D inmersiva del Desierto de la Tatacoa con React Three Fiber. Terrain shader personalizado, cielo infernal procedural, cactus en InstancedMesh y sistema de fuego por partículas.',
    category: '3D',
    stack: ['React', 'Three.js', 'R3F', 'GLSL Shaders'],
    repo: 'https://github.com/Nxxo31/nva-demons',
    impact: 'Inmersivo · WebGL',
    year: '2026',
    status: 'live',
  },
  {
    slug: 'flag-edge',
    code: 'FLE',
    name: 'FlagEdge',
    tagline: 'Feature flags en Go para producción',
    desc: 'Servicio de feature flags en Go con persistencia SQLite, autenticación JWT, multi-tenancy y audit log. Control granular de features en producción con rollout progresivo.',
    category: 'Backend',
    stack: ['Go', 'SQLite', 'JWT', 'REST API'],
    repo: 'https://github.com/Nxxo31/flag-edge',
    impact: 'Open source · Go-native',
    year: '2026',
    status: 'live',
  },
  {
    slug: 'contract-guard',
    code: 'CTG',
    name: 'ContractGuard',
    tagline: 'Detector de breaking changes en APIs',
    desc: 'Detector de breaking changes en specs OpenAPI 3.x, GraphQL y gRPC para CI/CD. Previene deploys que rompen consumidores antes de salir a producción.',
    category: 'DevTools',
    stack: ['Node.js', 'OpenAPI', 'GraphQL', 'gRPC', 'CI/CD'],
    repo: 'https://github.com/Nxxo31/contract-guard',
    impact: 'CI gate · Multi-spec',
    year: '2026',
    status: 'live',
  },
  {
    slug: 'supply-radar',
    code: 'SRD',
    name: 'SupplyRadar',
    tagline: 'Auditoría de supply chain en dependencias',
    desc: 'CLI para escanear dependencias Go y npm en busca de vulnerabilidades vía OSV API. Open source, sin dependencias externas, integración directa con pipelines.',
    category: 'Seguridad',
    stack: ['Go', 'OSV API', 'SBOM', 'CLI'],
    repo: 'https://github.com/Nxxo31/supply-radar',
    impact: 'DevSecOps · Open source',
    year: '2026',
    status: 'live',
  },
  {
    slug: 'synth-test',
    code: 'SYT',
    name: 'SynthTest',
    tagline: 'Property-based testing para APIs',
    desc: 'Generador property-based de suites de testing para APIs desde JSON Schema. Ejecuta contra endpoints, reporta fallos con shrinking automático.',
    category: 'DevTools',
    stack: ['TypeScript', 'JSON Schema', 'Property-based'],
    repo: 'https://github.com/Nxxo31/synth-test',
    impact: 'Property-based · Auto-shrink',
    year: '2026',
    status: 'prototype',
  },
  {
    slug: 'tic-tac-toe',
    code: 'TTT',
    name: 'Tic-Tac-Toe Glassmorphism',
    tagline: 'Tres en raya con IA MiniMax y glassmorphism',
    desc: 'Tres en raya con IA MiniMax (algoritmo perfecto, nunca pierde) y diseño glassmorphism de alta calidad para portafolio profesional.',
    category: 'IA',
    stack: ['JavaScript', 'MiniMax Algorithm', 'CSS Glassmorphism'],
    repo: 'https://github.com/Nxxo31/Tic-Tac-Toe',
    impact: 'IA perfecta · UI premium',
    year: '2026',
    status: 'live',
  },
  {
    slug: 'grani-usco',
    code: 'GRN',
    name: 'Grani USCO',
    tagline: 'Landing comercial para negocio gastronómico local',
    desc: 'Landing page optimizada para Grani USCO — negocio de granizados con alcohol en Neiva, Colombia. Conversión mobile-first.',
    category: 'Web',
    stack: ['HTML/CSS/JS', 'Mobile-first', 'SEO Local'],
    repo: 'https://github.com/Nxxo31/grani-usco',
    impact: 'Comercial · Mobile-first',
    year: '2026',
    status: 'live',
  },
  {
    slug: 'nexoaccmanager',
    code: 'NAM',
    name: 'NexoAccManager',
    tagline: 'Account manager seguro y open source',
    desc: 'Gestor de cuentas Roblox seguro, limpio y de código abierto. Diseñado con enfoque en seguridad y experiencia de usuario.',
    category: 'Seguridad',
    stack: ['TypeScript', 'Electron', 'Security-first'],
    repo: 'https://github.com/Nxxo31/NexoAccManager',
    impact: 'Open source · Security',
    year: '2026',
    status: 'live',
  },
];

export const categories = [
  { id: 'all', label: 'Todos', icon: '✦' },
  { id: 'SaaS', label: 'SaaS', icon: '◎' },
  { id: 'IA', label: 'IA', icon: '◈' },
  { id: 'DevTools', label: 'DevTools', icon: '◊' },
  { id: 'Seguridad', label: 'Seguridad', icon: '◇' },
  { id: '3D', label: '3D / Visual', icon: '◉' },
  { id: 'Web', label: 'Web', icon: '○' },
  { id: 'Backend', label: 'Backend', icon: '●' },
] as const;