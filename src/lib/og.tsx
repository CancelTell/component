import { ImageResponse } from 'next/og';
import { siteConfig } from './site';

/** Open Graph images: 1200×630 PNG, rendered at build time (static pages) or on first request */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = 'image/png';

let fontJob: Promise<ArrayBuffer | null> | null = null;

/** IBM Plex Sans with Cyrillic from Google Fonts; without it the image falls back to the default font */
function loadFont(): Promise<ArrayBuffer | null> {
  fontJob ??= (async () => {
    try {
      // No browser User-Agent → the API answers with a single TrueType file that has every subset
      const css = await (await fetch('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@600')).text();
      const url = css.match(/src:\s*url\((.+?)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
      return url ? await (await fetch(url)).arrayBuffer() : null;
    } catch {
      return null;
    }
  })();
  return fontJob;
}

export async function ogImage({ kicker, title, lines }: { kicker: string; title: string; lines: string[] }) {
  const font = await loadFont();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: '#111214',
          color: '#e7e8ea',
          fontFamily: font ? 'Plex' : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#3d7bf2', display: 'flex' }} />
          <div style={{ display: 'flex', fontSize: 30, letterSpacing: 2 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', fontSize: 30, color: '#9298a2' }}>{kicker}</div>
          <div style={{ display: 'flex', fontSize: title.length > 28 ? 64 : 80, lineHeight: 1.1 }}>{title}</div>
          {lines.length > 0 ? <div style={{ display: 'flex', fontSize: 30, color: '#c8cbd0' }}>{lines.join('  ·  ')}</div> : null}
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#3fb27f' }}>Проверка совместимости · характеристики · сравнение</div>
      </div>
    ),
    { ...ogSize, fonts: font ? [{ name: 'Plex', data: font, weight: 600, style: 'normal' }] : [] },
  );
}
