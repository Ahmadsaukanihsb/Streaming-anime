import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core (smallest possible)
          'react-core': ['react', 'react-dom'],
          // Router (separate for code splitting)
          'router': ['react-router-dom'],
          // UI components dialog/dropdown (used on many pages)
          'ui-core': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-tooltip'],
          // UI tabs (specific pages only)
          'ui-tabs': ['@radix-ui/react-tabs', '@radix-ui/react-accordion'],
          // Animation (heavy, load on demand)
          'animation': ['framer-motion'],
          // Lenis smooth scroll (only desktop)
          'lenis': ['lenis'],
        },
        // Ensure small chunks for better loading
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.css$/i.test(assetInfo.name || '')) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
      // Treeshake for better dead code elimination
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
      },
    },
    // Minification
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // CSS optimization
    cssMinify: true,
    // CSS code split - makes CSS non-render-blocking
    cssCodeSplit: true,
    // Report bundle size
    reportCompressedSize: true,
  },
  esbuild: {
    // Drop console logs and debugger in production
    drop: ['console', 'debugger'],
    // Legal comments in separate file
    legalComments: 'none',
  },
  server: {
    allowedHosts: ["animeku.xyz"],
  },
  // Optimize dependencies - exclude framer-motion to allow dynamic import
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    // Exclude heavy animation library - will be loaded on demand
    exclude: ['framer-motion'],
  },
});
