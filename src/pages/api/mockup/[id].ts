import type { APIRoute } from 'astro';
import { getMockup } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) {
    return new Response('not found', { status: 404 });
  }
  const row = getMockup.get(id) as { html_preview: string; prompt: string } | undefined;
  if (!row) {
    return new Response('not found', { status: 404 });
  }
  return new Response(row.html_preview, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
};