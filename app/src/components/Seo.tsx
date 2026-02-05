import { useEffect } from 'react';

const SITE_URL = 'https://animeku.xyz';
const DEFAULT_TITLE = 'Animeku — Nonton Anime Sub Indo Terbaru & Terlengkap';
const DEFAULT_DESCRIPTION =
  'Animeku menawarkan koleksi nonton anime sub indo terbaru dan terlengkap. Nikmati streaming anime ataupun download dengan kualitas HD secara gratis.';
const DEFAULT_IMAGE = '/images/hero/hero-jujutsu.jpg';
const DEFAULT_KEYWORDS =
  'nonton anime, nonton anime sub indo, streaming anime, download anime, anime terbaru, anime terlengkap, anime hd, animeku, nontonanime';

const ensureMeta = (attr: 'name' | 'property', key: string) => {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el;
};

const ensureLink = (rel: string) => {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  return el;
};

const toAbsoluteUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string;
  type?: 'website' | 'article' | 'video.other';
  noIndex?: boolean;
}

export default function Seo({
  title,
  description,
  image,
  url,
  keywords,
  type = 'website',
  noIndex = false,
}: SeoProps) {
  useEffect(() => {
    const pageTitle = title
      ? (title.toLowerCase().includes('animeku') ? title : `${title} | Animeku`)
      : DEFAULT_TITLE;
    const pageDescription = description || DEFAULT_DESCRIPTION;
    const pageKeywords = keywords || DEFAULT_KEYWORDS;
    const pageUrl =
      url || (typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : SITE_URL);
    const pageImage = toAbsoluteUrl(image || DEFAULT_IMAGE);

    document.title = pageTitle;

    ensureMeta('name', 'description').setAttribute('content', pageDescription);
    ensureMeta('name', 'keywords').setAttribute('content', pageKeywords);
    ensureMeta('name', 'robots').setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');

    ensureLink('canonical').setAttribute('href', pageUrl);

    ensureMeta('property', 'og:title').setAttribute('content', pageTitle);
    ensureMeta('property', 'og:description').setAttribute('content', pageDescription);
    ensureMeta('property', 'og:type').setAttribute('content', type);
    ensureMeta('property', 'og:url').setAttribute('content', pageUrl);
    ensureMeta('property', 'og:image').setAttribute('content', pageImage);
    ensureMeta('property', 'og:site_name').setAttribute('content', 'Animeku');
    ensureMeta('property', 'og:locale').setAttribute('content', 'id_ID');

    ensureMeta('name', 'twitter:card').setAttribute('content', 'summary_large_image');
    ensureMeta('name', 'twitter:title').setAttribute('content', pageTitle);
    ensureMeta('name', 'twitter:description').setAttribute('content', pageDescription);
    ensureMeta('name', 'twitter:image').setAttribute('content', pageImage);
  }, [title, description, image, url, keywords, type, noIndex]);

  return null;
}
