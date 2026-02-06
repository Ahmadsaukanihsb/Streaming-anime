// Centralized theme configuration
// All colors should be imported from here to maintain consistency

export const THEME = {
  colors: {
    // Primary colors
    primary: '#6C5DD3',
    primaryHover: '#5a4ec0',
    primaryLight: '#B7ABFF',
    primaryLighter: '#9B8CFF',
    primaryDark: '#5a4bbf',
    
    // Background colors
    background: '#0F0F1A',
    surface: '#1A1A2E',
    surfaceLight: '#16162a',
    surfaceLighter: '#1A1A1E',
    
    // Accent colors
    accentCyan: '#00C2FF',
    accentRed: '#FF6B6B',
    
    // Status colors
    status: {
      ongoing: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        solid: 'bg-green-500/80',
      },
      completed: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        solid: 'bg-blue-500/80',
      },
    },
    
    // Utility colors
    white: {
      5: 'rgba(255, 255, 255, 0.05)',
      10: 'rgba(255, 255, 255, 0.10)',
      20: 'rgba(255, 255, 255, 0.20)',
      30: 'rgba(255, 255, 255, 0.30)',
      40: 'rgba(255, 255, 255, 0.40)',
      50: 'rgba(255, 255, 255, 0.50)',
      60: 'rgba(255, 255, 255, 0.60)',
      70: 'rgba(255, 255, 255, 0.70)',
      80: 'rgba(255, 255, 255, 0.80)',
      90: 'rgba(255, 255, 255, 0.90)',
    },
  },
  
  // Border radius values
  radius: {
    sm: 'rounded-lg',      // 8px
    md: 'rounded-xl',      // 12px
    lg: 'rounded-2xl',     // 16px
    xl: 'rounded-3xl',     // 24px
    full: 'rounded-full',
  },
  
  // Shadow values
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    glow: 'shadow-[0_0_24px_rgba(108,93,211,0.12)]',
  },
  
  // Animation durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
} as const;

// Type helper for theme colors
export type ThemeColor = keyof typeof THEME.colors;
