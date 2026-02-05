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
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI components
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          // Animation
          'animation-vendor': ['framer-motion'],
          // Utilities
          'utils-vendor': ['date-fns'],
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
    },
    // Minification (gunakan esbuild yang built-in)
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'es2020',
  },
  server: {
    allowedHosts: ["animeku.xyz"],
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
});
