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
