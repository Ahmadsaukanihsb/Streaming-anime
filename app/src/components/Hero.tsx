import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight, Star, Clock, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { BACKEND_URL } from '@/config/api';
import { apiFetch } from '@/lib/api';
import OptimizedImage from '@/components/OptimizedImage';
import { createLogger } from '@/lib/logger';
import type { Anime } from '@/data/animeData';
import { getAnimeUrl, getWatchUrl, generateCleanSlug } from '@/lib/slug';

const logger = createLogger('Hero');

// Hero slide type derived from Anime with additional display fields
interface HeroSlide extends Anime {
  image: string;
  description: string;
  trailer?: string;
  trailerType?: 'youtube' | 'direct';
}

export default function Hero() {
  const { animeList } = useApp();
  const reducedMotion = useReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [heroAnimeIds, setHeroAnimeIds] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load hero settings from database
  useEffect(() => {
    const loadHeroSettings = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/settings/heroAnimeIds`);
        if (!res.ok) {
          logger.warn('[Hero] Settings fetch failed:', res.status, res.statusText);
          return;
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          logger.warn('[Hero] Settings response not JSON:', contentType);
          return;
        }
        let data: unknown;
        try {
          data = await res.json();
        } catch {
          logger.warn('[Hero] Settings JSON parse failed');
          return;
        }
        if (Array.isArray(data) && data.length > 0) {
          setHeroAnimeIds(data);
        }
      } catch (err) {
        logger.error('Failed to load hero settings:', err);
      }
    };
    loadHeroSettings();
  }, []);

  useEffect(() => {
    const update = () => setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Helper function to find anime by slug (id, cleanSlug, or generated from title)
  const findAnimeBySlug = (slug: string): Anime | undefined => {
    return animeList.find(a => {
      // 1. Cek exact match dengan id
      if (a.id === slug) return true;
      // 2. Cek match dengan cleanSlug yang tersimpan
      if (a.cleanSlug === slug) return true;
      // 3. Cek match dengan slug yang di-generate dari title
      const generatedSlug = generateCleanSlug(a.title);
      if (generatedSlug === slug) return true;
      // 4. Cek partial match dengan id (untuk backward compatibility)
      if (a.id.startsWith(slug + '-')) return true;
      return false;
    });
  };

  // Use custom hero anime if available, otherwise fallback to top rated - Memoized
  const heroSlides: HeroSlide[] = useMemo(() => {
    if (heroAnimeIds.length > 0) {
      return heroAnimeIds
        .map(id => findAnimeBySlug(id))
        .filter((anime): anime is NonNullable<typeof anime> => anime !== undefined)
        .map(anime => ({
          ...anime,
          image: anime.poster,
          description: anime.synopsis
        }));
    }
    return [...animeList]
      .filter(anime => anime.rating >= 7.5) // High rated anime
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5) // Top 5
      .map(anime => ({
        ...anime,
        image: anime.poster,
        description: anime.synopsis
      }));
  }, [heroAnimeIds, animeList]);

  const nextSlide = useCallback(() => {
    if (heroSlides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    setProgress(0);
  }, [heroSlides.length]);

  const prevSlide = useCallback(() => {
    if (heroSlides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    setProgress(0);
  }, [heroSlides.length]);

  // Auto-slide with progress
  useEffect(() => {
    if (!isAutoPlaying || heroSlides.length === 0) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + 2; // 50 steps * 120ms = 6 seconds
      });
    }, 120);

    return () => clearInterval(progressInterval);
  }, [isAutoPlaying, nextSlide, heroSlides.length]);

  // Don't render if no anime available
  if (heroSlides.length === 0) {
    return null;
  }

  const slide: HeroSlide | undefined = heroSlides[currentSlide];
  if (!slide) return null;
  const hasTrailer = slide.trailer && slide.trailer.length > 0;

  // Convert YouTube URL to embed format with autoplay
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    if (videoId) {
      // Parameters for background autoplay video
      const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        loop: '1',
        playlist: videoId,
        controls: '0',
        showinfo: '0',
        rel: '0',
        modestbranding: '1',
        playsinline: '1',
        enablejsapi: '1',
        start: '0',
        iv_load_policy: '3',  // Hide annotations
        fs: '0',              // Disable fullscreen
        disablekb: '1',       // Disable keyboard
        cc_load_policy: '0',  // Hide captions
      });
      return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    }
    return url;
  };

  return (
    <section
      className="relative h-[70vh] sm:h-[75vh] lg:h-[70vh] max-h-[800px] min-h-[420px] sm:min-h-[520px] w-full overflow-hidden"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const startX = touchStartX.current;
        const endX = e.changedTouches[0]?.clientX ?? null;
        if (startX == null || endX == null) return;
        const delta = endX - startX;
        if (Math.abs(delta) < 40) return;
        if (delta < 0) {
          nextSlide();
        } else {
          prevSlide();
        }
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 8000);
        touchStartX.current = null;
      }}
    >
      {/* Background - Video Trailer or Image */}
      {reducedMotion ? (
        // Mobile/Reduced Motion: Simple div without heavy animations
        <div key={currentSlide} className="absolute inset-0 animate-fade-in">
          <OptimizedImage
            src={slide.poster}
            alt={`Banner ${slide.title} - Nonton Anime Subtitle Indonesia Gratis`}
            aspectRatio="banner"
            priority
            className="w-full h-full"
            containerClassName="w-full h-full"
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F1A] via-[#0F0F1A]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-transparent to-[#0F0F1A]/40" />
        </div>
      ) : (
        // Desktop: Full animations with AnimatePresence
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.645, 0.045, 0.355, 1] }}
            className="absolute inset-0"
          >
            {hasTrailer ? (
              slide.trailerType === 'youtube' ? (
                <iframe
                  key={`yt-${slide.id}-${currentSlide}`}
                  src={getYouTubeEmbedUrl(slide.trailer!)}
                  className="w-full h-full object-cover scale-125"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="eager"
                  style={{ border: 'none', pointerEvents: 'none' }}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={slide.trailer}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <OptimizedImage
                src={slide.poster}
                alt={`Banner ${slide.title} - Nonton Anime Subtitle Indonesia Gratis`}
                aspectRatio="banner"
                priority
                className="w-full h-full"
                containerClassName="w-full h-full"
              />
            )}
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F1A] via-[#0F0F1A]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] via-transparent to-[#0F0F1A]/40" />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Mute/Unmute Button for direct video */}
      {hasTrailer && slide.trailerType === 'direct' && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute top-24 right-6 z-30 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center pt-16 lg:pt-20">
        {reducedMotion ? (
          <div key={currentSlide} className="max-w-2xl animate-fade-in">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="px-3 py-1.5 bg-gradient-to-r from-[#6C5DD3] to-[#8B7BEF] text-white text-xs font-bold rounded-full shadow-md sm:shadow-lg shadow-[#6C5DD3]/20 sm:shadow-[#6C5DD3]/30">
                ✨ FEATURED
              </span>
              <span className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full backdrop-blur-[2px] sm:backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 fill-current" />
                {slide.rating?.toFixed(1) || '0.0'}
              </span>
              <span className={`px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-[2px] sm:backdrop-blur-sm ${slide.status === 'Ongoing'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-blue-500/20 text-blue-400'
                }`}>
                {slide.status}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-heading text-white mb-3 leading-tight">
              {slide.title}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
              <span className="flex items-center gap-1.5">
                <Play className="w-4 h-4" />
                {slide.episodes || '?'} Episode
              </span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {slide.duration || '24 min'}
              </span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span>{slide.studio || 'Unknown Studio'}</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {slide.genres?.slice(0, 4).map((genre: string) => (
                <span key={genre} className="px-3 py-1 text-xs bg-white/10 text-white/80 rounded-full backdrop-blur-[2px] sm:backdrop-blur-sm">
                  {genre}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-white/70 mb-6 line-clamp-3 leading-relaxed max-w-xl">
              {slide.synopsis || 'Sinopsis belum tersedia.'}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-4">
              <Link
                to={getWatchUrl(slide, 1)}
                className="group flex items-center justify-center gap-2 px-5 py-2 text-sm bg-[#6C5DD3] hover:bg-[#5a4bbf] text-white font-semibold rounded-xl transition-all duration-300 shadow-md sm:shadow-lg shadow-[#6C5DD3]/20 sm:shadow-[#6C5DD3]/30 hover:shadow-[#6C5DD3]/40 w-full sm:w-auto sm:px-6 sm:py-3 sm:text-base"
              >
                <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                Tonton Sekarang
              </Link>
              <Link
                to={getAnimeUrl(slide)}
                className="flex items-center justify-center gap-2 px-5 py-2 text-sm bg-transparent hover:bg-white/10 text-white font-semibold rounded-xl transition-colors duration-200 border border-white/40 w-full sm:w-auto sm:px-6 sm:py-3 sm:text-base"
              >
                <Info className="w-5 h-5" />
                Detail Anime
              </Link>
            </div>

            <div className="mt-3 flex items-center gap-2 sm:hidden">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#6C5DD3]/20 text-[#9B8CFF] rounded-full border border-[#6C5DD3]/30">
                Featured
              </span>
              <p className="text-xs text-white/50">
                Geser untuk melihat anime unggulan lainnya.
              </p>
              <span className="ml-1 inline-block text-white/40 animate-pulse">
                →
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 sm:hidden">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    setProgress(0);
                  }}
                  className={`h-1.5 rounded-full transition-all ${index === currentSlide
                    ? 'w-6 bg-[#6C5DD3]'
                    : 'w-2 bg-white/30'
                    }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="px-3 py-1.5 bg-gradient-to-r from-[#6C5DD3] to-[#8B7BEF] text-white text-xs font-bold rounded-full shadow-md sm:shadow-lg shadow-[#6C5DD3]/20 sm:shadow-[#6C5DD3]/30">
                ✨ FEATURED
              </span>
              <span className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full backdrop-blur-[2px] sm:backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 fill-current" />
                {slide.rating?.toFixed(1) || '0.0'}
              </span>
              <span className={`px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-[2px] sm:backdrop-blur-sm ${slide.status === 'Ongoing'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-blue-500/20 text-blue-400'
                }`}>
                {slide.status}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-heading text-white mb-3 leading-tight">
              {slide.title}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
              <span className="flex items-center gap-1.5">
                <Play className="w-4 h-4" />
                {slide.episodes || '?'} Episode
              </span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {slide.duration || '24 min'}
              </span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span>{slide.studio || 'Unknown Studio'}</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-4">
              {slide.genres?.slice(0, 4).map((genre: string) => (
                <span key={genre} className="px-3 py-1 text-xs bg-white/10 text-white/80 rounded-full backdrop-blur-[2px] sm:backdrop-blur-sm">
                  {genre}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-white/70 mb-6 line-clamp-3 leading-relaxed max-w-xl">
              {slide.synopsis || 'Sinopsis belum tersedia.'}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-4">
              <Link
                to={getWatchUrl(slide, 1)}
                className="group flex items-center justify-center gap-2 px-5 py-2 text-sm bg-[#6C5DD3] hover:bg-[#5a4bbf] text-white font-semibold rounded-xl transition-all duration-300 shadow-md sm:shadow-lg shadow-[#6C5DD3]/20 sm:shadow-[#6C5DD3]/30 hover:shadow-[#6C5DD3]/40 w-full sm:w-auto sm:px-6 sm:py-3 sm:text-base"
              >
                <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                Tonton Sekarang
              </Link>
              <Link
                to={getAnimeUrl(slide)}
                className="flex items-center justify-center gap-2 px-5 py-2 text-sm bg-transparent hover:bg-white/10 text-white font-semibold rounded-xl transition-colors duration-200 border border-white/40 w-full sm:w-auto sm:px-6 sm:py-3 sm:text-base"
              >
                <Info className="w-5 h-5" />
                Detail Anime
              </Link>
            </div>

            <div className="mt-3 flex items-center gap-2 sm:hidden">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#6C5DD3]/20 text-[#9B8CFF] rounded-full border border-[#6C5DD3]/30">
                Featured
              </span>
              <p className="text-xs text-white/50">
                Geser untuk melihat anime unggulan lainnya.
              </p>
              <span className="ml-1 inline-block text-white/40 animate-pulse">
                →
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 sm:hidden">
              {heroSlides.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${index === currentSlide
                    ? 'w-6 bg-[#6C5DD3]'
                    : 'w-2 bg-white/30'
                    }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-1/2 translate-y-1/2 left-4 right-4 hidden sm:flex justify-between pointer-events-none z-20">
        <button
          onClick={() => {
            prevSlide();
            setIsAutoPlaying(false);
            setTimeout(() => setIsAutoPlaying(true), 10000);
          }}
          className="pointer-events-auto p-3 rounded-full bg-black/30 backdrop-blur-[2px] sm:backdrop-blur-sm text-white/70 hover:bg-[#6C5DD3] hover:text-white transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            nextSlide();
            setIsAutoPlaying(false);
            setTimeout(() => setIsAutoPlaying(true), 10000);
          }}
          className="pointer-events-auto p-3 rounded-full bg-black/30 backdrop-blur-[2px] sm:backdrop-blur-sm text-white/70 hover:bg-[#6C5DD3] hover:text-white transition-all duration-300"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnail Strip */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-3">
        {heroSlides.map((item, index) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentSlide(index);
              setProgress(0);
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 10000);
            }}
            className={`relative group overflow-hidden rounded-lg transition-all duration-300 ${index === currentSlide
              ? 'w-20 h-12 ring-2 ring-[#6C5DD3] ring-offset-2 ring-offset-[#0F0F1A]'
              : 'w-16 h-10 opacity-50 hover:opacity-100'
              }`}
          >
            <OptimizedImage
              src={item.poster}
              alt={`Thumbnail ${item.title}`}
              aspectRatio="poster"
              containerClassName="w-full h-full"
            />
            {/* Progress Bar on Active */}
            {index === currentSlide && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30">
                <motion.div
                  className="h-full bg-[#6C5DD3]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Mobile Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 md:hidden">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlide(index);
              setProgress(0);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
              ? 'w-8 bg-[#6C5DD3]'
              : 'w-1.5 bg-white/30 hover:bg-white/50'
              }`}
          />
        ))}
      </div>

      {/* Side Gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0F0F1A] to-transparent pointer-events-none z-10" />
    </section>
  );
}
