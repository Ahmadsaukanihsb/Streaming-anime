import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

if (process.env.SKIP_PRERENDER === '1') {
  console.log('[prerender] skipped (SKIP_PRERENDER=1)');
  process.exit(0);
}

const require = createRequire(import.meta.url);
const Prerenderer = require('@prerenderer/prerenderer');
const PuppeteerRenderer = require('@prerenderer/renderer-puppeteer');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const sitemapPath = path.join(distDir, 'sitemap.xml');

const DEFAULT_ROUTES = [
  '/',
  '/anime-list',
  '/movies',
  '/schedule',
  '/community',
  '/genres',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/faq',
];

const normalizePath = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.pathname || '/';
  } catch {
    if (!value.startsWith('/')) return `/${value}`;
    return value;
  }
};

const readRoutesFromSitemap = async () => {
  try {
    const xml = await fs.readFile(sitemapPath, 'utf8');
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    return matches.map(normalizePath).filter(Boolean);
  } catch (err) {
    console.warn('[prerender] sitemap not found, using default routes');
    return [];
  }
};

const buildRoutes = async () => {
  const fromSitemap = await readRoutesFromSitemap();
  const animeRoutes = fromSitemap.filter((route) => route.startsWith('/anime/'));
  const limit = Number.parseInt(process.env.PRERENDER_LIMIT || '50', 10);
  const includeAll = process.env.PRERENDER_ALL === '1';

  const selectedAnimeRoutes = includeAll ? animeRoutes : animeRoutes.slice(0, Math.max(0, limit));
  const merged = new Set([...DEFAULT_ROUTES, ...selectedAnimeRoutes]);

  return Array.from(merged);
};

const run = async () => {
  const routes = await buildRoutes();
  console.log(`[prerender] rendering ${routes.length} routes`);

  if (!routes.length) {
    console.log('[prerender] no routes to render, skipping');
    return;
  }

  const prerenderer = new Prerenderer({
    staticDir: distDir,
    renderer: new PuppeteerRenderer({
      headless: true,
      renderAfterTime: 2000,
      maxConcurrentRoutes: 4,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }),
  });

  try {
    await prerenderer.initialize();
    const rendered = await prerenderer.renderRoutes(routes);
    await prerenderer.destroy();
    console.log(`[prerender] done (${rendered.length} routes)`);
  } catch (err) {
    console.error('[prerender] failed:', err);
    try {
      await prerenderer.destroy();
    } catch {}
    process.exit(1);
  }
};

run();
