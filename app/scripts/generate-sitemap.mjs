import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const SITE_URL = process.env.SITE_URL || 'https://animeku.xyz';
const BACKEND_URL = process.env.SITEMAP_BACKEND_URL || 'https://api.animeku.xyz';

const staticRoutes = [
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/anime-list', changefreq: 'daily', priority: 0.8 },
  { loc: '/movies', changefreq: 'weekly', priority: 0.6 },
  { loc: '/schedule', changefreq: 'daily', priority: 0.7 },
  { loc: '/community', changefreq: 'daily', priority: 0.7 },
  { loc: '/genres', changefreq: 'weekly', priority: 0.6 },
  { loc: '/about', changefreq: 'monthly', priority: 0.4 },
  { loc: '/contact', changefreq: 'monthly', priority: 0.4 },
  { loc: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { loc: '/terms', changefreq: 'yearly', priority: 0.3 },
  { loc: '/faq', changefreq: 'monthly', priority: 0.3 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, attempts = 3) => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'animeku-sitemap/1.0',
        },
        redirect: 'follow',
      });
      if (res.ok) return res;
      console.warn(`[sitemap] backend returned ${res.status} ${res.statusText}`);
      if (res.status >= 500 && i < attempts - 1) {
        await sleep(400 * (i + 1));
        continue;
      }
      return res;
    } catch (err) {
      console.warn('[sitemap] fetch error:', err?.message || err);
      if (i < attempts - 1) {
        await sleep(400 * (i + 1));
        continue;
      }
      return null;
    }
  }
  return null;
};

const fetchAnimeIds = async () => {
  const res = await fetchWithRetry(`${BACKEND_URL}/api/anime/custom`);
  if (!res || !res.ok) return [];
  try {
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((anime) => anime?.id)
      .filter((id) => typeof id === 'string' && id.trim().length > 0);
  } catch (err) {
    console.warn('[sitemap] invalid JSON:', err?.message || err);
    return [];
  }
};

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildUrl = (loc, changefreq, priority) => {
  const now = new Date().toISOString();
  return `
  <url>
    <loc>${escapeXml(`${SITE_URL}${loc}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
};

const generateSitemap = async () => {
  const animeIds = await fetchAnimeIds();
  const animeRoutes = animeIds.map((id) => ({
    loc: `/anime/${encodeURIComponent(id)}`,
    changefreq: 'weekly',
    priority: 0.7,
  }));

  const allRoutes = [...staticRoutes, ...animeRoutes];
  const uniqueByLoc = new Map();
  allRoutes.forEach((route) => uniqueByLoc.set(route.loc, route));

  const body = Array.from(uniqueByLoc.values())
    .map((route) => buildUrl(route.loc, route.changefreq, route.priority))
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  console.log(`[sitemap] generated ${uniqueByLoc.size} urls`);
};

generateSitemap();
