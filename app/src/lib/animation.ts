/**
 * Animation utilities with mobile optimization
 * Reduces/Disables heavy animations on mobile devices for better performance
 */

import { useEffect, useState } from 'react';

// Check if device is mobile/low-end
// Initialize with correct value to prevent flash/flicker
const getInitialMobileState = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isMobileWidth = window.innerWidth < 768;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return isMobileWidth || (isTouchDevice && isMobileWidth) || prefersReducedMotion;
};

export function useIsMobileDevice(): boolean {
  // Initialize with correct value immediately to prevent flicker
  const [isMobile, setIsMobile] = useState(getInitialMobileState);

  useEffect(() => {
    // Check screen width
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      // Also check for touch device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      setIsMobile(isMobileWidth || (isTouchDevice && isMobileWidth) || prefersReducedMotion);
    };

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Check if user prefers reduced motion
const getInitialReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export function usePrefersReducedMotion(): boolean {
  // Initialize with correct value immediately to prevent flicker
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialReducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// Animation variants for Framer Motion with mobile optimization
export const fadeInVariants = {
  default: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  },
  // Reduced motion for mobile
  reduced: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 }
  }
};

export const scaleInVariants = {
  default: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  },
  reduced: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.1 }
  }
};

export const slideInVariants = {
  default: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, delay: 0.1 }
  },
  reduced: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.1 }
  }
};

// Stagger children variants
export const staggerContainerVariants = {
  default: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  reduced: {
    animate: {
      transition: {
        staggerChildren: 0
      }
    }
  }
};

// Get appropriate variant based on device
export function useAnimationVariant() {
  const isMobile = useIsMobileDevice();
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldReduceMotion = isMobile || prefersReducedMotion;

  return {
    getVariant: (variant: 'fadeIn' | 'scaleIn' | 'slideIn') => {
      if (shouldReduceMotion) {
        switch (variant) {
          case 'fadeIn': return fadeInVariants.reduced;
          case 'scaleIn': return scaleInVariants.reduced;
          case 'slideIn': return slideInVariants.reduced;
        }
      }
      switch (variant) {
        case 'fadeIn': return fadeInVariants.default;
        case 'scaleIn': return scaleInVariants.default;
        case 'slideIn': return slideInVariants.default;
      }
    },
    shouldReduceMotion,
    isMobile
  };
}

// CSS classes for simple animations (GPU accelerated)
export const cssAnimations = {
  fadeIn: 'animate-[fadeIn_0.3s_ease-out]',
  slideUp: 'animate-[slideUp_0.3s_ease-out]',
  scaleIn: 'animate-[scaleIn_0.2s_ease-out]',
  // For mobile: instant or very fast
  instant: 'transition-opacity duration-100'
} as const;
