import type { APIRoute } from 'astro';
import { LOCALES, DEFAULT_LOCALE } from '~/i18n';
import { projects } from '~/data/catalog';
import { TEMPLATES } from '~/data/templates';

export const prerender = false;

/**
 * GET /sitemap.xml
 *
 * Sitemap dinamico (route SSR) en vez de un archivo estatico: se construye
 * desde las rutas reales y los datos del catalogo, asi que no se queda
 * desactualizado cuando anaden un producto o un template.
 *
 * Convencion de locales: 'es' vive en la raiz (prefixDefaultLocale=false),
 * 'en' en /en/... y 'pt' en /pt/....
 */

const SITE = 'https://nx-studio.nx-studio.workers.dev';

type Entry = {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
};

const STATIC_ROUTES: Entry[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/servicios/', changefreq: 'monthly', priority: '0.9' },
  { path: '/servicios/testing/', changefreq: 'monthly', priority: '0.7' },
  { path: '/productos/', changefreq: 'weekly', priority: '0.9' },
  { path: '/templates/', changefreq: 'weekly', priority: '0.9' },
  { path: '/cotizador/', changefreq: 'monthly', priority: '0.9' },
  { path: '/laboratorio/', changefreq: 'monthly', priority: '0.8' },
  { path: '/contacto/', changefreq: 'yearly', priority: '0.8' },
  { path: '/brand/', changefreq: 'yearly', priority: '0.5' },
  { path: '/logos/', changefreq: 'yearly', priority: '0.5' },
];

function localePath(path: string, locale: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return `/${locale}${path}`;
}

export const GET: APIRoute = async () => {
  const entries: Entry[] = [...STATIC_ROUTES];

  for (const p of projects) {
    entries.push({
      path: `/productos/${p.slug}/`,
      changefreq: 'monthly',
      priority: '0.7',
    });
  }

  for (const t of TEMPLATES) {
    entries.push({
      path: `/templates/${t.slug}/`,
      changefreq: 'monthly',
      priority: '0.8',
    });
  }

  const lastmod = new Date().toISOString().slice(0, 10);
  const urls: string[] = [];

  for (const entry of entries) {
    for (const locale of LOCALES) {
      const loc = localePath(entry.path, locale);
      const alternates = LOCALES.map(
        (l) =>
          `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${localePath(entry.path, l)}"/>`
      ).join('');
      urls.push(
        `  <url>\n` +
          `    <loc>${SITE}${loc}</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>${entry.changefreq}</changefreq>\n` +
          `    <priority>${entry.priority}</priority>\n` +
          `${alternates}\n` +
          `  </url>`
      );
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urls.join('\n')}\n` +
    `</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
