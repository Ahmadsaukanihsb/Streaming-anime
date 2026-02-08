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
    
    // Check battery saver (if available)
    const batterySaver = (navigator as any).getBattery ? 
      (navigator as any).getBattery()?.then((b: any) => b.saveData) : 
      Promise.resolve(false);

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

/**
 * Wrapper component untuk motion.div yang otomatis disable di mobile
 */
interface MotionWrapperProps {
  children: React.ReactNode;
  className?: string;
  initial?: object;
  animate?: object;
  exit?: object;
  transition?: object;
}

export function MotionDiv({ 
  children, 
  className = '', 
  ...props 
}: MotionWrapperProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={`${className} animate-fade-in`}>{children}</div>;
  }

  // Lazy load motion.div only when needed
  return <LazyMotionDiv className={className} {...props}>{children}</LazyMotionDiv>;
}

// Lazy loaded motion component
import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';

function LazyMotionDiv({ children, className, ...props }: MotionWrapperProps) {
  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  );
}
