import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Suspense, lazy, useEffect } from 'react';
import { AppProvider } from '@/context/AppContext';
import ScrollToTop from '@/components/ScrollToTop';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/toast-simple';
import PageLoader from '@/components/PageLoader';

// ==========================================
// LAYOUT COMPONENTS (Eager load to prevent flickering)
// These are always visible and should not flicker on navigation
// ==========================================
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import GlobalChat from '@/components/GlobalChat';

// ==========================================
// CRITICAL PAGES (Eager for LCP)
// Home is eagerly loaded to avoid request chain
// that delays LCP (Largest Contentful Paint)
// ==========================================
import Home from '@/pages/Home';

// ==========================================
// LAZY LOADED PAGES (Code Splitting)
// ==========================================

// Core Pages
const AnimeDetail = lazy(() => import('@/pages/AnimeDetail'));
const Search = lazy(() => import('@/pages/Search'));
const AnimeList = lazy(() => import('@/pages/AnimeList'));
const Genres = lazy(() => import('@/pages/Genres'));
const Schedule = lazy(() => import('@/pages/Schedule'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Auth Pages
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));

// User Pages
const Profile = lazy(() => import('@/pages/Profile'));

// Watch Page (heavy video player)
const Watch = lazy(() => import('@/pages/Watch'));

// Content Pages
const Movies = lazy(() => import('@/pages/Movies'));
const Community = lazy(() => import('@/pages/Community'));
const DiscussionDetail = lazy(() => import('@/pages/DiscussionDetail'));

// Info Pages
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Donate = lazy(() => import('@/pages/Donate'));

// Admin Pages (heavy)
const Admin = lazy(() => import('@/pages/Admin'));
const SkipTimesManager = lazy(() => import('@/pages/admin/SkipTimesManager'));

// Schema (lazy is fine, not visible)
const WebsiteSchema = lazy(() => import('@/components/SchemaOrg').then(m => ({ default: m.WebsiteSchema })));

// Dynamically load Lenis only when needed
const loadLenis = () => import('lenis').then(m => m.default || m);

// ==========================================
// Lenis Smooth Scroll Component (lazy loaded, disabled on mobile)
// ==========================================
function SmoothScroll({ children }: { children: React.ReactNode }) {
  const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false;

  useEffect(() => {
    // Skip Lenis on mobile devices for better performance
    if (isMobile) {
      return;
    }

    let lenis: any;
    let rafId = 0;

    // Dynamically import Lenis only on desktop
    loadLenis().then((LenisClass) => {
      lenis = new LenisClass({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        touchMultiplier: 2,
      });

      // Expose Lenis instance for ScrollToTop
      (window as any).__lenis = lenis;

      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (lenis) {
        lenis.destroy();
        delete (window as any).__lenis;
      }
    };
  }, [isMobile]);

  return <>{children}</>;
}

// ==========================================
// ROUTE CONFIGURATION
// ==========================================
function AppRoutes() {
  return (
    <Routes>
      {/* Home - Eagerly loaded for best LCP */}
      <Route path="/" element={<Home />} />
      <Route path="/anime/:id" element={
        <Suspense fallback={<PageLoader />}>
          <AnimeDetail />
        </Suspense>
      } />
      <Route path="/search" element={
        <Suspense fallback={<PageLoader />}>
          <Search />
        </Suspense>
      } />
      <Route path="/anime-list" element={
        <Suspense fallback={<PageLoader />}>
          <AnimeList />
        </Suspense>
      } />
      <Route path="/genres" element={
        <Suspense fallback={<PageLoader />}>
          <Genres />
        </Suspense>
      } />
      <Route path="/schedule" element={
        <Suspense fallback={<PageLoader />}>
          <Schedule />
        </Suspense>
      } />

      {/* Auth Routes */}
      <Route path="/login" element={
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      } />
      <Route path="/register" element={
        <Suspense fallback={<PageLoader />}>
          <Register />
        </Suspense>
      } />

      {/* User Routes - Lazy Loaded */}
      <Route path="/profile" element={
        <Suspense fallback={<PageLoader />}>
          <Profile />
        </Suspense>
      } />
      <Route path="/bookmarks" element={
        <Suspense fallback={<PageLoader />}>
          <Profile />
        </Suspense>
      } />
      <Route path="/watchlist" element={
        <Suspense fallback={<PageLoader />}>
          <Profile />
        </Suspense>
      } />

      {/* Watch Routes - Lazy Loaded (Heavy Video Player) */}
      <Route path="/watch/:id/:episode" element={
        <Suspense fallback={<PageLoader />}>
          <Watch />
        </Suspense>
      } />
      <Route path="/watch/:id" element={
        <Suspense fallback={<PageLoader />}>
          <Watch />
        </Suspense>
      } />

      {/* Content Routes - Lazy Loaded */}
      <Route path="/movies" element={
        <Suspense fallback={<PageLoader />}>
          <Movies />
        </Suspense>
      } />
      <Route path="/community" element={
        <Suspense fallback={<PageLoader />}>
          <Community />
        </Suspense>
      } />
      <Route path="/community/discussion/:id" element={
        <Suspense fallback={<PageLoader />}>
          <DiscussionDetail />
        </Suspense>
      } />

      {/* Info Routes - Lazy Loaded */}
      <Route path="/about" element={
        <Suspense fallback={<PageLoader />}>
          <About />
        </Suspense>
      } />
      <Route path="/contact" element={
        <Suspense fallback={<PageLoader />}>
          <Contact />
        </Suspense>
      } />
      <Route path="/donate" element={
        <Suspense fallback={<PageLoader />}>
          <Donate />
        </Suspense>
      } />
      <Route path="/privacy" element={
        <Suspense fallback={<PageLoader />}>
          <Privacy />
        </Suspense>
      } />
      <Route path="/terms" element={
        <Suspense fallback={<PageLoader />}>
          <Terms />
        </Suspense>
      } />
      <Route path="/faq" element={
        <Suspense fallback={<PageLoader />}>
          <FAQ />
        </Suspense>
      } />

      {/* Admin Routes - Lazy Loaded (Heavy Admin Panel) */}
      <Route path="/admin" element={
        <Suspense fallback={<PageLoader />}>
          <Admin />
        </Suspense>
      } />
      <Route path="/admin/skip-times" element={
        <Suspense fallback={<PageLoader />}>
          <SkipTimesManager />
        </Suspense>
      } />

      {/* Redirects for legacy routes */}
      <Route path="/latest-episodes" element={<AnimeList />} />
      <Route path="/top-rated" element={<AnimeList />} />

      {/* 404 Catch-all - must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ToastProvider>
          <AppProvider>
            <Router>
              <SmoothScroll>
                <ScrollToTop />
                <Suspense fallback={null}>
                  <WebsiteSchema />
                </Suspense>
                <div className="min-h-screen bg-[#0F0F1A] pb-16 sm:pb-0">
                  <Navbar />
                  <AppRoutes />
                  <Footer />
                  <BottomNav />
                  <GlobalChat />
                </div>
              </SmoothScroll>
            </Router>
          </AppProvider>
        </ToastProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
