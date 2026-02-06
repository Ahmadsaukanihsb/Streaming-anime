import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Suspense, lazy } from 'react';
import { AppProvider } from '@/context/AppContext';
import { useEffect } from 'react';
import Lenis from 'lenis';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import ScrollToTop from '@/components/ScrollToTop';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/ui/toast';
import PageLoader from '@/components/PageLoader';

// ==========================================
// CRITICAL PAGES (Eager Loaded)
// These are the main entry points that should load immediately
// ==========================================
import Home from '@/pages/Home';
import AnimeDetail from '@/pages/AnimeDetail';
import Search from '@/pages/Search';
import AnimeList from '@/pages/AnimeList';
import Genres from '@/pages/Genres';
import Schedule from '@/pages/Schedule';
import NotFound from '@/pages/NotFound';
import { WebsiteSchema } from '@/components/SchemaOrg';

// ==========================================
// LAZY LOADED PAGES (Code Splitting)
// These pages are loaded on-demand to reduce initial bundle size
// ==========================================

// Auth Pages (only needed for login/register)
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));

// User Pages (only needed for logged in users)
const Profile = lazy(() => import('@/pages/Profile'));

// Watch Page (heavy video player, only needed when watching)
const Watch = lazy(() => import('@/pages/Watch'));

// Content Pages (optional navigation)
const Movies = lazy(() => import('@/pages/Movies'));
const Community = lazy(() => import('@/pages/Community'));
const DiscussionDetail = lazy(() => import('@/pages/DiscussionDetail'));

// Info Pages (static content)
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Donate = lazy(() => import('@/pages/Donate'));

// Admin Page (heavy, only for admins)
const Admin = lazy(() => import('@/pages/Admin'));

// ==========================================
// Lenis Smooth Scroll Component (disabled on mobile for better performance)
// ==========================================
function SmoothScroll({ children }: { children: React.ReactNode }) {
  const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false;

  useEffect(() => {
    // Skip Lenis on mobile devices for better performance
    if (isMobile) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    // Expose Lenis instance for ScrollToTop
    (window as any).__lenis = lenis;

    let rafId = 0;

    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      delete (window as any).__lenis;
      lenis.destroy();
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
      {/* Critical Routes - Eager Loaded */}
      <Route path="/" element={<Home />} />
      <Route path="/anime/:id" element={<AnimeDetail />} />
      <Route path="/search" element={<Search />} />
      <Route path="/anime-list" element={<AnimeList />} />
      <Route path="/genres" element={<Genres />} />
      <Route path="/schedule" element={<Schedule />} />

      {/* Auth Routes - Lazy Loaded */}
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

      {/* Admin Route - Lazy Loaded (Heavy Admin Panel) */}
      <Route path="/admin" element={
        <Suspense fallback={<PageLoader />}>
          <Admin />
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
                <WebsiteSchema />
                <div className="min-h-screen bg-[#0F0F1A] pb-16 sm:pb-0">
                  <Navbar />
                  <AppRoutes />
                  <Footer />
                  <BottomNav />
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
