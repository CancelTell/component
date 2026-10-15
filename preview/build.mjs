// Builds a single self-contained preview HTML (preview/dist/index.html) from the app sources.
import { build } from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const out = resolve(here, 'dist');
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [resolve(here, 'main.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  outdir: out,
  entryNames: 'app',
  nodePaths: ['/home/claude/.npm-global/lib/node_modules'],
  alias: {
    '@': resolve(root, 'src'),
    'next/link': resolve(here, 'shims/next-link.tsx'),
    'next/navigation': resolve(here, 'shims/next-navigation.ts'),
    'next/font/google': resolve(here, 'shims/next-font.ts'),
    'lucide-react': resolve(here, 'shims/lucide-react.tsx'),
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.NEXT_PUBLIC_SITE_URL': '"https://preview.local"',
  },
  loader: { '.svg': 'text' },
  logLevel: 'warning',
});

const html = readFileSync(resolve(here, 'index.html'), 'utf8')
  .replace('<!--CSS-->', `<style>${readFileSync(resolve(out, 'app.css'), 'utf8')}</style>`)
  .replace('<!--JS-->', `<script>${readFileSync(resolve(out, 'app.js'), 'utf8').replace(/<\/script/g, '<\\/script')}</script>`);
writeFileSync(resolve(out, 'index.html'), html);

// Body-only variant for hosts that wrap the page in their own document skeleton
const css = readFileSync(resolve(out, 'app.css'), 'utf8');
const js = readFileSync(resolve(out, 'app.js'), 'utf8').replace(/<\/script/g, '<\\/script');
const fragment = `<title>COMPONENT</title>
<meta name="theme-color" content="#131011">
<script>(function(){var t=\'dark\';try{if(localStorage.getItem(\'component:theme\')===\'light\')t=\'light\'}catch(e){}document.documentElement.dataset.theme=t})();</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
<style>:root{--font-plex-sans:'IBM Plex Sans';--font-plex-mono:'IBM Plex Mono'}${css}.header{top:env(safe-area-inset-top,0px)}</style>
<div id="root" style="display:contents"></div>
<script>${js}</script>
`;
writeFileSync(resolve(out, 'artifact.html'), fragment);
console.log('preview built', (html.length / 1024).toFixed(0), 'KB');
