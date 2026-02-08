import { useState, useEffect } from 'react';

/**
 * Hook untuk mendeteksi apakah device harus menggunakan reduced motion
 * - Mobile devices (max-width: 640px)
 * - User preference (prefers-reduced-motion: reduce)
 * - Low-power mode (battery saver)
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check mobile
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    
    // Check user preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    setReducedMotion(isMobile || prefersReducedMotion);

    // Listen for changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 640px)');

    const handleChange = () => {
      setReducedMotion(
        mobileQuery.matches || motionQuery.matches
      );
    };

    motionQuery.addEventListener('change', handleChange);
    mobileQuery.addEventListener('change', handleChange);

    return () => {
      motionQuery.removeEventListener('change', handleChange);
      mobileQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return reducedMotion;
}
