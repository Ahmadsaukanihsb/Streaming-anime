import { useState, useEffect, useRef } from 'react';

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

// Convert any image URL to WebP using a service or CDN
// If using external API, replace with your CDN endpoint
function getWebPUrl(originalUrl: string, _width?: number): string {
  if (!originalUrl) return '';
  
  // Skip if already WebP/AVIF or data URL
  if (originalUrl.endsWith('.webp') || originalUrl.endsWith('.avif') || originalUrl.startsWith('data:')) {
    return originalUrl;
  }
  
  // For external images (e.g., from anime API), you can use:
  // 1. Cloudinary
  // 2. ImageKit
  // 3. Cloudflare Images
  // 4. Or proxy through your own service
  
  // Example using Cloudinary (replace with your config):
  // return `https://res.cloudinary.com/your-cloud/image/fetch/f_webp,q_auto,w_${width || 400}/${encodeURIComponent(originalUrl)}`;
  
  // For now, return original but in real implementation, use CDN
  return originalUrl;
}

// Generate srcset for responsive images
function generateSrcSet(originalUrl: string): string {
  if (!originalUrl || originalUrl.startsWith('data:')) return originalUrl;
  
  const widths = [150, 300, 450, 600, 800];
  return widths
    .map(w => `${getWebPUrl(originalUrl, w)} ${w}w`)
    .join(', ');
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

export default function OptimizedImage({
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
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate WebP src and srcset
  const webpSrc = getWebPUrl(src);
  const srcSet = generateSrcSet(src);



  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-[#1A1A2E] ${
        aspectRatio ? getAspectRatioClass(aspectRatio) : ''
      } ${containerClassName}`}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] to-[#0F0F1A] animate-pulse" />
      )}

      {/* Main image with WebP support */}
      {isInView && !hasError && (
        <picture>
          {/* AVIF - best compression */}
          <source
            srcSet={srcSet.replace(/\.(jpg|jpeg|png)/g, '.avif')}
            type="image/avif"
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 300px, 400px"
          />
          {/* WebP - good compression, wide support */}
          <source
            srcSet={srcSet.replace(/\.(jpg|jpeg|png)/g, '.webp')}
            type="image/webp"
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 300px, 400px"
          />
          {/* JPEG/PNG fallback */}
          <img
            ref={imgRef}
            src={webpSrc}
            srcSet={srcSet}
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 300px, 400px"
            alt={alt}
            loading={loading}
            decoding={priority ? 'sync' : 'async'}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
          />
        </picture>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A2E]">
          <span className="text-white/30 text-xs">Failed to load</span>
        </div>
      )}
    </div>
  );
}
