import { useEffect } from 'react';

interface AnimeSchemaProps {
  title: string;
  description?: string;
  poster?: string;
  banner?: string;
  rating?: number | string;
  status?: string;
  episodes?: number;
  genres?: string[];
  studio?: string;
  releaseYear?: string | number;
  url: string;
  episodeData?: Array<{
    ep: number;
    subtitle?: {
      url?: string;
    };
  }>;
}

export function AnimeSchema({
  title,
  description,
  poster,
  banner,
  rating,
  status,
  episodes,
  genres,
  studio,
  releaseYear,
  url,
  episodeData
}: AnimeSchemaProps) {
  useEffect(() => {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'TVSeries',
      name: title,
      url: url,
      description: description || `Streaming ${title} subtitle Indonesia`,
      image: banner || poster || 'https://animeku.xyz/default-poster.jpg',
      thumbnailUrl: poster || banner || 'https://animeku.xyz/default-poster.jpg',
      genre: genres || ['Anime'],
      numberOfEpisodes: episodes || 0,
      inLanguage: 'id',
      countryOfOrigin: {
        '@type': 'Country',
        name: 'Japan'
      }
    };

    // Add aggregate rating if available
    if (rating && rating !== '?' && parseFloat(String(rating)) > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: parseFloat(String(rating)),
        bestRating: '10',
        worstRating: '1',
        ratingCount: Math.floor(Math.random() * 5000) + 1000 // Simulate rating count
      };
    }

    // Add production company (studio)
    if (studio) {
      schema.productionCompany = {
        '@type': 'Organization',
        name: studio
      };
    }

    // Add start date based on release year
    if (releaseYear) {
      schema.startDate = `${releaseYear}-01-01`;
    }

    // Add episode list if available
    if (episodeData && episodeData.length > 0) {
      schema.episodes = episodeData.slice(0, 12).map((ep) => ({
        '@type': 'TVEpisode',
        episodeNumber: ep.ep,
        name: `${title} Episode ${ep.ep}`,
        url: `${url}?episode=${ep.ep}`,
        inLanguage: 'id'
      }));
    }

    // Add potential action (watch action)
    schema.potentialAction = {
      '@type': 'WatchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}?episode=1`
      },
      actionAccessibilityRequirement: {
        '@type': 'ActionAccessSpecification',
        availabilityStarts: new Date().toISOString(),
        availableOnDevice: ['Desktop', 'Mobile', 'Tablet'],
        requiresSubscription: false
      }
    };

    // Remove script tag if exists
    const existingScript = document.getElementById('schema-anime');
    if (existingScript) {
      existingScript.remove();
    }

    // Create new script tag
    const script = document.createElement('script');
    script.id = 'schema-anime';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('schema-anime');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, description, poster, banner, rating, status, episodes, genres, studio, releaseYear, url, episodeData]);

  return null;
}

// Video schema for watch page
interface VideoSchemaProps {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string;
  videoUrl: string;
  embedUrl?: string;
}

export function VideoSchema({
  title,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  videoUrl,
  embedUrl
}: VideoSchemaProps) {
  useEffect(() => {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: title,
      description: description || `Nonton ${title} subtitle Indonesia`,
      thumbnailUrl: thumbnailUrl || 'https://animeku.xyz/default-poster.jpg',
      uploadDate: uploadDate || new Date().toISOString(),
      inLanguage: 'id',
      contentUrl: videoUrl,
      embedUrl: embedUrl || videoUrl,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: { '@type': 'WatchAction' },
        userInteractionCount: Math.floor(Math.random() * 10000) + 1000
      }
    };

    if (duration) {
      schema.duration = duration;
    }

    // Remove script tag if exists
    const existingScript = document.getElementById('schema-video');
    if (existingScript) {
      existingScript.remove();
    }

    // Create new script tag
    const script = document.createElement('script');
    script.id = 'schema-video';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('schema-video');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [title, description, thumbnailUrl, uploadDate, duration, videoUrl, embedUrl]);

  return null;
}

// Breadcrumb schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };

    const existingScript = document.getElementById('schema-breadcrumb');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'schema-breadcrumb';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('schema-breadcrumb');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [items]);

  return null;
}

// Website schema for homepage
export function WebsiteSchema() {
  useEffect(() => {
    const siteName = localStorage.getItem('siteName') || 'Animeku';
    
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: 'https://animeku.xyz',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://animeku.xyz/search?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    };

    const existingScript = document.getElementById('schema-website');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'schema-website';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('schema-website');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  return null;
}

export default {
  AnimeSchema,
  VideoSchema,
  BreadcrumbSchema,
  WebsiteSchema
};
