// HeroMobile - Smooth hero carousel for mobile
// Uses CSS transitions with hardware acceleration and touch swipe gestures
// Synced with admin panel hero settings

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getAnimeUrl, getWatchUrl } from '@/lib/slug';
import { BACKEND_URL } from '@/config/api';
import { apiFetch } from '@/lib/api';

const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds
const SWIPE_THRESHOLD = 50; // Minimum swipe distance in pixels
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity for quick swipe

// Helper function to generate clean slug from title
const generateCleanSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export default function HeroMobile() {
  const { animeList } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [heroAnimeIds, setHeroAnimeIds] = useState<string[]>([]);
  const [firstImagePreloaded, setFirstImagePreloaded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  // Load hero settings from database (same as desktop Hero)
  useEffect(() => {
    const loadHeroSettings = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/settings/heroAnimeIds`);
        if (!res.ok) return;
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHeroAnimeIds(data);
        }
      } catch {
        // Silently fail, will use fallback
      }
    };
    loadHeroSettings();
  }, []);

  // Helper function to find anime by slug (id, cleanSlug, or generated from title)
  const findAnimeBySlug = useCallback((slug: string) => {
    return animeList.find(a => {
      if (a.id === slug) return true;
      if (a.cleanSlug === slug) return true;
      const generatedSlug = generateCleanSlug(a.title);
      if (generatedSlug === slug) return true;
      if (a.id.startsWith(slug + '-')) return true;
      return false;
    });
  }, [animeList]);

  // Use custom hero anime if available, otherwise fallback to top rated
  const slides = useMemo(() => {
    if (heroAnimeIds.length > 0 && animeList.length > 0) {
      const customSlides = heroAnimeIds
        .map(id => findAnimeBySlug(id))
        .filter((anime): anime is NonNullable<typeof anime> => anime !== undefined)
        .map(anime => ({
          ...anime,
          image: anime.poster,
          description: anime.synopsis
        }));

      if (customSlides.length > 0) {
        return customSlides;
      }
    }

    // Fallback to top rated anime
    if (animeList.length === 0) return [];
    return [...animeList]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map(anime => ({
        ...anime,
        image: anime.poster,
        description: anime.synopsis
      }));
  }, [heroAnimeIds, animeList, findAnimeBySlug]);

  // Preload first hero image for better LCP
  useEffect(() => {
    if (slides.length === 0 || firstImagePreloaded) return;

    const firstImage = slides[0]?.poster;
    if (!firstImage) return;

    // Check if preload already exists
    const existingPreload = document.querySelector(`link[rel="preload"][href="${firstImage}"]`);
    if (existingPreload) {
      setFirstImagePreloaded(true);
      return;
    }

    // Create preload link for LCP image
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = firstImage;
    link.setAttribute('fetchpriority', 'high');
    if (firstImage.endsWith('.webp')) {
      link.type = 'image/webp';
    }
    document.head.appendChild(link);
    setFirstImagePreloaded(true);

    // Cleanup
    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [slides, firstImagePreloaded]);

  // Auto-slide logic
  useEffect(() => {
    if (slides.length <= 1 || isPaused || isDragging) return;

    const interval = setInterval(() => {
      if (!isAnimating) {
        goToSlide((currentSlide + 1) % slides.length);
      }
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [slides.length, isPaused, isDragging, currentSlide, isAnimating]);

  // Navigation handlers with animation lock
  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index === currentSlide) return;

    setIsAnimating(true);
    setCurrentSlide(index);
    setIsPaused(true);

    // Animation duration is 600ms, add small buffer
    setTimeout(() => setIsAnimating(false), 650);

    // Resume auto-slide after 10 seconds of inactivity
    setTimeout(() => setIsPaused(false), 10000);
  }, [isAnimating, currentSlide]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY, time: Date.now() });
    setIsDragging(true);
    setIsPaused(true);
  }, [isAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || isAnimating) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Only track horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      // Add resistance at edges
      const maxDrag = 150;
      const resistance = 0.4;
      let offset = deltaX;

      if ((currentSlide === 0 && deltaX > 0) ||
        (currentSlide === slides.length - 1 && deltaX < 0)) {
        offset = deltaX * resistance;
      }

      setDragOffset(Math.max(-maxDrag, Math.min(maxDrag, offset)));
    }
  }, [touchStart, isAnimating, currentSlide, slides.length]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart) return;

    const deltaTime = Date.now() - touchStart.time;
    const velocity = Math.abs(dragOffset) / deltaTime;

    // Determine if we should change slides
    const shouldChangeSlide =
      Math.abs(dragOffset) > SWIPE_THRESHOLD ||
      velocity > SWIPE_VELOCITY_THRESHOLD;

    if (shouldChangeSlide) {
      if (dragOffset > 0 && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      } else if (dragOffset < 0 && currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1);
      }
    }

    // Reset drag state
    setDragOffset(0);
    setIsDragging(false);
    setTouchStart(null);

    // Resume auto-slide after 10 seconds
    setTimeout(() => setIsPaused(false), 10000);
  }, [touchStart, dragOffset, currentSlide, slides.length, goToSlide]);

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];

  return (
    <section
      ref={containerRef}
      className="hero-section relative touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Images - smooth transitions with hardware acceleration */}
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((s, index) => {
          const isActive = index === currentSlide;
          const isPrev = index === (currentSlide - 1 + slides.length) % slides.length;
          const isNext = index === (currentSlide + 1) % slides.length;

          // Calculate transform based on drag offset
          let translateX = 0;
          if (isDragging && dragOffset !== 0) {
            if (isActive) {
              translateX = dragOffset * 0.3; // Slight parallax effect
            }
          }

          return (
            <img
              key={s.id}
              src={s.poster}
              alt={s.title}
              width={640}
              height={960}
              className="hero-image absolute inset-0"
              style={{
                opacity: isActive ? 1 : (isPrev || isNext) && isDragging ? 0.5 : 0,
                transform: `translateX(${translateX}px) scale(${isActive ? 1 : 1.05})`,
                transition: isDragging
                  ? 'none'
                  : 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'opacity, transform',
              }}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={index === 0 ? 'high' : 'low'}
            />
          );
        })}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(15,15,26,0.9) 0%, rgba(15,15,26,0.4) 50%, transparent 100%), linear-gradient(to top, rgba(15,15,26,1) 0%, transparent 40%)'
          }}
        />
      </div>

      {/* Content with smooth transitions */}
      <div className="relative z-10 h-full flex items-end pb-8 px-4">
        <div
          className="w-full"
          style={{
            transform: isDragging ? `translateX(${dragOffset * 0.5}px)` : 'translateX(0)',
            transition: isDragging ? 'none' : 'transform 300ms ease-out',
          }}
        >
          {/* Featured Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#6C5DD3]/20 border border-[#6C5DD3]/30 rounded-full mb-3">
            <Star className="w-3 h-3 text-[#9B8CFF]" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#9B8CFF]">
              Featured
            </span>
          </div>

          {/* Title with smooth transition */}
          <div className="overflow-hidden">
            <h1
              key={slide.id}
              className="text-2xl font-bold text-white mb-2 leading-tight line-clamp-2"
              style={{
                animation: 'slideUp 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
              }}
            >
              {slide.title}
            </h1>
          </div>

          {/* Meta with staggered animation */}
          <div
            key={`meta-${slide.id}`}
            className="flex items-center gap-3 text-xs text-white/60 mb-3"
            style={{
              animation: 'fadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1) 100ms forwards',
              opacity: 0,
            }}
          >
            <span>{slide.episodes || '?'} Episode</span>
            <span>•</span>
            <span>{slide.rating.toFixed(1)} ★</span>
          </div>

          {/* Synopsis with staggered animation */}
          <p
            key={`synopsis-${slide.id}`}
            className="text-sm text-white/70 mb-4 line-clamp-2"
            style={{
              animation: 'fadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1) 200ms forwards',
              opacity: 0,
            }}
          >
            {slide.synopsis || 'Sinopsis belum tersedia.'}
          </p>

          {/* Actions with staggered animation */}
          <div
            key={`actions-${slide.id}`}
            className="flex gap-3 mb-4"
            style={{
              animation: 'fadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1) 300ms forwards',
              opacity: 0,
            }}
          >
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

          {/* Slide Indicators & Navigation */}
          {slides.length > 1 && (
            <div className="flex items-center justify-between">
              {/* Dots with smooth animation */}
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className="rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: index === currentSlide ? '24px' : '8px',
                      height: '8px',
                      backgroundColor: index === currentSlide ? '#6C5DD3' : 'rgba(255,255,255,0.3)',
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Arrow Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  disabled={isAnimating}
                  className="p-2 rounded-full bg-white/10 active:bg-white/20 transition-colors disabled:opacity-50"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={nextSlide}
                  disabled={isAnimating}
                  className="p-2 rounded-full bg-white/10 active:bg-white/20 transition-colors disabled:opacity-50"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline keyframe animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}
