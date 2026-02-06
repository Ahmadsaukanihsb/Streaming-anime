import { useState, useCallback, useRef, useEffect } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'poster' | 'banner' | 'square' | 'video' | 'avatar' | 'custom';
  customAspect?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill';
  blurHash?: string;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
}

// Aspect ratio mappings
const aspectRatios = {
  poster: 'aspect-[2/3]',      // 2:3 - Anime poster
  banner: 'aspect-[16/9]',     // 16:9 - Hero banner
  square: 'aspect-square',     // 1:1 - Avatars
  video: 'aspect-video',       // 16:9 - Video thumbnails
  avatar: 'aspect-square',     // 1:1 - User avatars
  custom: '',                  // Custom aspect ratio
};



export default function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  aspectRatio = 'poster',
  customAspect,
  priority = false,
  objectFit = 'cover',
  blurHash,
  fallbackSrc,
  onLoad,
  onError,
  sizes = '100vw',
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
      onError?.();
    }
  }, [currentSrc, fallbackSrc, onError]);

  // Retry loading
  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
    setCurrentSrc(src + '?retry=' + Date.now());
  }, [src]);

  // Generate srcSet for responsive images
  const generateSrcSet = useCallback(() => {
    if (!src || src.startsWith('data:')) return undefined;
    
    // If it's already a processed image from CDN, don't add srcSet
    if (src.includes('cloudflare') || src.includes('r2')) {
      return undefined;
    }

    return undefined; // Disable for now until we have image CDN
  }, [src]);

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
  }[objectFit];

  const aspectClass = aspectRatio === 'custom' && customAspect 
    ? '' 
    : aspectRatios[aspectRatio];

  const customStyle = aspectRatio === 'custom' && customAspect
    ? { aspectRatio: customAspect }
    : undefined;

  // Error state
  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden bg-[#1A1A2E] flex flex-col items-center justify-center gap-2',
          aspectClass,
          containerClassName
        )}
        style={customStyle}
      >
        <AlertCircle className="w-8 h-8 text-white/20" />
        <span className="text-xs text-white/40 text-center px-4">
          Gagal memuat gambar
        </span>
        <button
          onClick={handleRetry}
          className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-[#1A1A2E]',
        aspectClass,
        containerClassName
      )}
      style={customStyle}
    >
      {/* Blur Placeholder */}
      {!isLoaded && (
        <div 
          className={cn(
            'absolute inset-0 bg-gradient-to-br from-[#252538] to-[#1A1A2E] animate-pulse',
            className
          )}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
      )}

      {/* Loading spinner */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-white/10" />
        </div>
      )}

      {/* Actual Image */}
      {(isInView || priority) && (
        <img
          ref={imageRef}
          src={currentSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          srcSet={generateSrcSet()}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-all duration-500',
            objectFitClass,
            isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm',
            className
          )}
        />
      )}

      {/* Low Quality Image Placeholder (LQIP) */}
      {blurHash && !isLoaded && (
        <img
          src={blurHash}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 w-full h-full object-cover blur-xl scale-110',
            objectFitClass
          )}
        />
      )}
    </div>
  );
}

// Preload critical images
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}


