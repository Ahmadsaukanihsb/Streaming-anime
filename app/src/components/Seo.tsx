import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'video';
  ogVideo?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const siteConfig = {
  name: 'Animeku',
  url: 'https://animeku.xyz',
  defaultImage: 'https://animeku.xyz/images/hero/hero-jujutsu.jpg',
  twitterHandle: '@animeku',
  defaultDescription: 'Animeku menawarkan koleksi nonton anime sub indo terbaru dan terlengkap. Nikmati streaming anime ataupun download dengan kualitas HD secara gratis.',
  defaultKeywords: 'nonton anime, nonton anime sub indo, streaming anime, download anime, anime terbaru, anime hd, animeku, nontonanime',
};

export function SEO({
  title,
  description = siteConfig.defaultDescription,
  keywords = siteConfig.defaultKeywords,
  canonical,
  ogImage = siteConfig.defaultImage,
  ogType = 'website',
  ogVideo,
  noIndex = false,
  jsonLd,
}: SEOProps) {
  const fullTitle = title 
    ? `${title} — ${siteConfig.name}` 
    : `${siteConfig.name} — Nonton Anime Sub Indo Terbaru & Terlengkap`;
  
  const fullCanonical = canonical ? `${siteConfig.url}${canonical}` : siteConfig.url;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonical} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:locale" content="id_ID" />
      
      {/* Video specific OG tags */}
      {ogVideo && (
        <>
          <meta property="og:video" content={ogVideo} />
          <meta property="og:video:type" content="text/html" />
        </>
      )}

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={siteConfig.twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

// Pre-configured SEO for common page types
export function HomeSEO() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <SEO
      description="Animeku menawarkan koleksi nonton anime sub indo terbaru dan terlengkap. Nikmati streaming anime ataupun download dengan kualitas HD secara gratis."
      canonical="/"
      jsonLd={jsonLd}
    />
  );
}

export function AnimeDetailSEO({
  title,
  description,
  image,
  url,
  rating,
  genres,
  status,
  episodes,
  year,
}: {
  title: string;
  description: string;
  image: string;
  url: string;
  rating?: string;
  genres?: string[];
  status?: string;
  episodes?: number;
  year?: number;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: title,
    description: description,
    image: image,
    url: `${siteConfig.url}${url}`,
    ...(rating && { aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rating,
      bestRating: '10',
    }}),
    ...(genres && { genre: genres }),
    ...(status && { status: status }),
    ...(episodes && { numberOfEpisodes: episodes }),
    ...(year && { startDate: `${year}-01-01` }),
    countryOfOrigin: {
      '@type': 'Country',
      name: 'Japan',
    },
    inLanguage: 'ja',
    subtitleLanguage: 'id',
  };

  return (
    <SEO
      title={title}
      description={description}
      canonical={url}
      ogImage={image}
      ogType="article"
      keywords={`${title}, nonton ${title}, streaming ${title}, anime ${title}, ${genres?.join(', ') || ''}`}
      jsonLd={jsonLd}
    />
  );
}

export function WatchSEO({
  title,
  description,
  image,
  url,
  videoUrl,
  episode,
}: {
  title: string;
  description: string;
  image: string;
  url: string;
  videoUrl?: string;
  episode?: number;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `${title} ${episode ? `- Episode ${episode}` : ''}`,
    description: description,
    thumbnailUrl: image,
    uploadDate: new Date().toISOString(),
    ...(videoUrl && { contentUrl: videoUrl, embedUrl: videoUrl }),
    author: {
      '@type': 'Organization',
      name: siteConfig.name,
    },
  };

  return (
    <SEO
      title={`${title} ${episode ? `Episode ${episode}` : ''}`}
      description={description}
      canonical={url}
      ogImage={image}
      ogType="video"
      ogVideo={videoUrl}
      keywords={`${title}, episode ${episode}, nonton ${title}, streaming ${title}`}
      jsonLd={jsonLd}
    />
  );
}

export function SearchSEO({ query }: { query?: string }) {
  const title = query ? `Hasil Pencarian: ${query}` : 'Cari Anime';
  
  return (
    <SEO
      title={title}
      description={`Cari dan temukan anime ${query || ''} subtitle Indonesia terbaru dan terlengkap hanya di Animeku. Streaming dan download gratis kualitas HD.`}
      canonical={`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`}
      noIndex={!query}
    />
  );
}

export function StaticPageSEO({
  title,
  description,
  canonical,
}: {
  title: string;
  description: string;
  canonical: string;
}) {
  return (
    <SEO
      title={title}
      description={description}
      canonical={canonical}
    />
  );
}

export default SEO;
