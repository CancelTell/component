import { categories, categoryPayload, isCategoryId, products } from '@/data';
import { toSearchEntry } from '@/lib/search';

/**
 * Static JSON files for the browser, generated at build time:
 *   /data/cpu.json, /data/gpu.json, …  one category with store offers (builder, saved builds, comparison)
 *   /data/search.json                   small index for the header search
 * They keep the catalog out of the JS bundle; the browser loads only the category it needs.
 */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [...categories.map((c) => ({ file: `${c.id}.json` })), { file: 'search.json' }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const name = file.replace(/\.json$/, '');
  const body =
    name === 'search'
      ? { items: products.map(toSearchEntry) }
      : isCategoryId(name)
        ? categoryPayload(name)
        : null;
  if (!body) return new Response('Not found', { status: 404 });
  return Response.json(body, { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } });
}
