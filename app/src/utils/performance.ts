// Performance optimization utilities

// Lazy load images with Intersection Observer
export const lazyLoadImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
};

// Preload critical resources
export const preloadResource = (href: string, as: 'font' | 'image' | 'script' | 'style') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
};

// Defer non-critical JavaScript
export const deferScript = (src: string) => {
  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  document.body.appendChild(script);
};

// Measure Core Web Vitals (for analytics, not console logging)
export const measureWebVitals = () => {
  // LCP - Largest Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    // Send to analytics or store for later use
    (window as any).webVitals = { ...(window as any).webVitals, LCP: lastEntry.startTime };
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // CLS - Cumulative Layout Shift
  let cls = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        cls += (entry as any).value;
      }
    }
    // Store for analytics
    (window as any).webVitals = { ...(window as any).webVitals, CLS: cls };
  }).observe({ entryTypes: ['layout-shift'] });

  // FID - First Input Delay
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const delay = (entry as any).processingStart - entry.startTime;
      // Store for analytics
      (window as any).webVitals = { ...(window as any).webVitals, FID: delay };
    }
  }).observe({ entryTypes: ['first-input'] });
};

// Preconnect to required origins
export const preconnectOrigins = () => {
  const origins = [
    'https://api.animeku.xyz',
    'https://cdn.animeku.xyz'
  ];
  
  origins.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};
