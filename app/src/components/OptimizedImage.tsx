import { useState, useEffect, useRef, memo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  aspectRatio?: 'poster' | 'banner' | 'square' | 'video';
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Convert image URL to WebP version
function getWebPUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  
  // Skip if already WebP/AVIF or data URL
  if (originalUrl.endsWith('.webp') || originalUrl.endsWith('.avif') || originalUrl.startsWith('data:')) {
    return originalUrl;
  }
  
  // Replace extension with .webp
  return originalUrl.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
}

// Get aspect ratio class
function getAspectRatioClass(ratio: string): string {
  switch (ratio) {
    case 'poster':
      return 'aspect-[2/3]';
    case 'banner':
      return 'aspect-[16/9]';
    case 'square':
      return 'aspect-square';
    case 'video':
      return 'aspect-video';
    default:
      return '';
  }
}

// Memoized image component for better performance
const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  priority = false,
  aspectRatio,
  containerClassName = '',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority || loading === 'eager');
  const containerRef = useRef<HTMLDivElement>(null);
  const imageLoadedRef = useRef(false);

  // Intersection Observer for lazy loading - only on client
  useEffect(() => {
    if (priority || loading === 'eager' || typeof window === 'undefined') {
      setIsInView(true);
      return;
    }

    // Check if IntersectionObserver is available
    if (!('IntersectionObserver' in window)) {
      // Fallback: load image immediately
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !imageLoadedRef.current) {
          imageLoadedRef.current = true;
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Load 100px before entering viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  const handleLoad = () => {
    if (!isLoaded) {
      setIsLoaded(true);
      onLoad?.();
    }
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const webpSrc = getWebPUrl(src);
  const shouldLoad = isInView || priority;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#1A1A2E] ${
        aspectRatio ? getAspectRatioClass(aspectRatio) : ''
      } ${containerClassName}`}
    >
      {/* Loading placeholder - only show if not loaded and no error */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] to-[#0F0F1A]">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Actual image - only load when in view */}
      {shouldLoad && !hasError && (
        <picture>
          {/* WebP version */}
          <source 
            srcSet={webpSrc} 
            type="image/webp" 
          />
          {/* Original format as fallback */}
          <img
            src={src}
            alt={alt}
            loading={loading}
            decoding={priority ? 'sync' : 'async'}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            // Add fetchpriority for critical images
            {...(priority && { fetchpriority: 'high' })}
          />
        </picture>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A2E]">
          <span className="text-white/30 text-xs text-center px-2">{alt || 'Image'}</span>
        </div>
      )}
    </div>
  );
});

export default OptimizedImage;
