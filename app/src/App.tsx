import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { useEffect } from 'react';
import Lenis from 'lenis';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';

// Pages
import Home from '@/pages/Home';
import AnimeDetail from '@/pages/AnimeDetail';
import Watch from '@/pages/Watch';
import Search from '@/pages/Search';
import AnimeList from '@/pages/AnimeList';
import Movies from '@/pages/Movies';
import Genres from '@/pages/Genres';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import Community from '@/pages/Community';
import DiscussionDetail from '@/pages/DiscussionDetail';
import Schedule from '@/pages/Schedule';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import FAQ from '@/pages/FAQ';
import NotFound from '@/pages/NotFound';

// Lenis Smooth Scroll Component
function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

function App() {
  return (
    <AppProvider>
      <Router>
        <SmoothScroll>
          <ScrollToTop />
          <div className="min-h-screen bg-[#0F0F1A]">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/anime/:id" element={<AnimeDetail />} />
              <Route path="/watch/:id/:episode" element={<Watch />} />
              <Route path="/watch/:id" element={<Watch />} />
              <Route path="/search" element={<Search />} />
              <Route path="/anime-list" element={<AnimeList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/bookmarks" element={<Profile />} />
              <Route path="/watchlist" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />

              {/* Content pages */}
              <Route path="/genres" element={<Genres />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/discussion/:id" element={<DiscussionDetail />} />
              <Route path="/schedule" element={<Schedule />} />

              {/* Info pages */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/faq" element={<FAQ />} />

              {/* Redirects for legacy routes */}
              <Route path="/latest-episodes" element={<AnimeList />} />
              <Route path="/top-rated" element={<AnimeList />} />

              {/* 404 Catch-all - must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </div>
        </SmoothScroll>
      </Router>
    </AppProvider>
  );
}

export default App;

