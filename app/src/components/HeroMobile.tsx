// HeroMobile - Lightweight hero carousel for mobile
// Uses CSS transitions instead of Framer Motion for better performance

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getAnimeUrl, getWatchUrl } from '@/lib/slug';

const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds

export default function HeroMobile() {
  const { animeList } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Get top 5 anime for carousel
  const slides = useMemo(() => {
    if (animeList.length === 0) return [];
    return [...animeList]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map(anime => ({
        ...anime,
        image: anime.poster,
        description: anime.synopsis
      }));
  }, [animeList]);

  // Auto-slide logic
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  // Navigation handlers
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setIsPaused(true);
    // Resume auto-slide after 10 seconds of inactivity
    setTimeout(() => setIsPaused(false), 10000);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];

  return (
    <section className="hero-section relative">
      {/* Background Images - preload next for smooth transition */}
      <div className="absolute inset-0 overflow-hidden">
        {slides.map((s, index) => (
          <img
            key={s.id}
            src={s.poster}
            alt={s.title}
            className={`hero-image absolute inset-0 transition-opacity duration-500 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={index === 0 ? 'high' : 'low'}
          />
        ))}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(15,15,26,0.9) 0%, rgba(15,15,26,0.4) 50%, transparent 100%), linear-gradient(to top, rgba(15,15,26,1) 0%, transparent 40%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-end pb-8 px-4">
        <div className="w-full">
          {/* Featured Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#6C5DD3]/20 border border-[#6C5DD3]/30 rounded-full mb-3">
            <Star className="w-3 h-3 text-[#9B8CFF]" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#9B8CFF]">
              Featured
            </span>
          </div>

          {/* Title with transition */}
          <h1
            key={slide.id}
            className="text-2xl font-bold text-white mb-2 leading-tight line-clamp-2 animate-fade-in"
          >
            {slide.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-white/60 mb-3">
            <span>{slide.episodes || '?'} Episode</span>
            <span>•</span>
            <span>{slide.rating.toFixed(1)} ★</span>
          </div>

          {/* Synopsis */}
          <p className="text-sm text-white/70 mb-4 line-clamp-2">
            {slide.synopsis || 'Sinopsis belum tersedia.'}
          </p>

          {/* Actions */}
          <div className="flex gap-3 mb-4">
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
              {/* Dots */}
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`transition-all duration-300 rounded-full ${index === currentSlide
                        ? 'w-6 h-2 bg-[#6C5DD3]'
                        : 'w-2 h-2 bg-white/30'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Arrow Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-full bg-white/10 active:bg-white/20 transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-full bg-white/10 active:bg-white/20 transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
