// HeroMobile - Ultra lightweight hero for mobile only
// No animations, no auto-slide, no Framer Motion, minimal re-renders

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getAnimeUrl, getWatchUrl } from '@/lib/slug';

export default function HeroMobile() {
  const { animeList } = useApp();

  // Get only ONE slide - the top rated anime
  const slide = useMemo(() => {
    if (animeList.length === 0) return null;
    // Just get the top rated anime, no complex filtering
    const topAnime = [...animeList]
      .sort((a, b) => b.rating - a.rating)[0];
    
    if (!topAnime) return null;
    return {
      ...topAnime,
      image: topAnime.poster,
      description: topAnime.synopsis
    };
  }, [animeList]);

  if (!slide) return null;

  return (
    <section className="hero-section">
      {/* Static Background Image - Native img for fastest load */}
      <div className="absolute inset-0">
        <img
          src={slide.poster}
          alt={slide.title}
          className="hero-image"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        {/* Simple gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(15,15,26,0.9) 0%, rgba(15,15,26,0.4) 50%, transparent 100%), linear-gradient(to top, rgba(15,15,26,1) 0%, transparent 40%)'
          }}
        />
      </div>

      {/* Content - Static, no animations */}
      <div className="relative z-10 h-full flex items-end pb-8 px-4">
        <div className="w-full">
          {/* Featured Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#6C5DD3]/20 border border-[#6C5DD3]/30 rounded-full mb-3">
            <Star className="w-3 h-3 text-[#9B8CFF]" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#9B8CFF]">
              Featured
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2 leading-tight line-clamp-2">
            {slide.title}
          </h1>

          {/* Meta - Simple text, no icons if possible */}
          <div className="flex items-center gap-3 text-xs text-white/60 mb-3">
            <span>{slide.episodes || '?'} Episode</span>
            <span>•</span>
            <span>{slide.rating.toFixed(1)} ★</span>
          </div>

          {/* Synopsis - Max 2 lines */}
          <p className="text-sm text-white/70 mb-4 line-clamp-2">
            {slide.synopsis || 'Sinopsis belum tersedia.'}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              to={getWatchUrl(slide, 1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#6C5DD3] text-white text-sm font-semibold rounded-lg active:scale-95 transition-transform"
            >
              <Play className="w-4 h-4 fill-current" />
              Tonton
            </Link>
            <Link
              to={getAnimeUrl(slide)}
              className="px-4 py-2.5 border border-white/30 text-white text-sm font-semibold rounded-lg active:bg-white/10 transition-colors"
            >
              Detail
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
