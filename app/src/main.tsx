import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { preconnectOrigins, lazyLoadImages } from './utils/performance'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Performance optimizations
// Preconnect to critical origins
preconnectOrigins()

// Initialize lazy loading for images
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', lazyLoadImages)
} else {
  lazyLoadImages()
}

// Re-run lazy loading after React renders
setTimeout(lazyLoadImages, 100)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, show update notification
                console.log('[PWA] New content available, refresh to update.');
                // Optionally dispatch event for UI to show update prompt
                window.dispatchEvent(new CustomEvent('swUpdate', { detail: registration }));
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('[PWA] Service Worker registration failed:', error);
      });
  });
}
