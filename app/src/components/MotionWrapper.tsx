import { motion, type TargetAndTransition, type Transition, type VariantLabels } from 'framer-motion';
import { useIsMobileDevice, usePrefersReducedMotion } from '@/lib/animation';
import type { ReactNode } from 'react';

interface MotionWrapperProps {
  children: ReactNode;
  className?: string;
  initial?: boolean | TargetAndTransition | VariantLabels;
  animate?: boolean | TargetAndTransition | VariantLabels;
  transition?: Transition;
  whileHover?: TargetAndTransition | VariantLabels;
  whileTap?: TargetAndTransition | VariantLabels;
}

/**
 * MotionWrapper - Conditional Framer Motion wrapper
 * Uses CSS transitions on mobile for better performance
 * Uses Framer Motion on desktop for smooth animations
 */
export function MotionDiv({ 
  children, 
  className = '', 
  initial, 
  animate, 
  transition,
  whileHover,
  whileTap
}: MotionWrapperProps) {
  const isMobile = useIsMobileDevice();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const shouldReduceMotion = isMobile || prefersReducedMotion;

  // On mobile or reduced motion preference, use simple div with CSS transitions
  if (shouldReduceMotion) {
    return (
      <div 
        className={`${className} transition-all duration-200`}
        style={{
          opacity: typeof animate === 'object' && animate && 'opacity' in animate ? (animate.opacity as number) : 1,
          transform: 'none'
        }}
      >
        {children}
      </div>
    );
  }

  // On desktop, use Framer Motion
  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      transition={transition}
      whileHover={whileHover}
      whileTap={whileTap}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

/**
 * StaggerContainer - Container for staggered children animations
 * Disabled on mobile for performance
 */
export function StaggerContainer({ 
  children, 
  className = '',
  staggerDelay = 0.1
}: StaggerContainerProps) {
  const isMobile = useIsMobileDevice();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const shouldReduceMotion = isMobile || prefersReducedMotion;

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

/**
 * StaggerItem - Individual item for staggered animations
 * Uses simpler animation on mobile
 */
export function StaggerItem({ children, className = '', index = 0 }: StaggerItemProps) {
  const isMobile = useIsMobileDevice();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  const shouldReduceMotion = isMobile || prefersReducedMotion;

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.4,
            delay: index * 0.05,
            ease: [0.16, 1, 0.3, 1]
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}
