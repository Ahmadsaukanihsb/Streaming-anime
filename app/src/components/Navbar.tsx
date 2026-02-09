import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  User,
  Menu,
  X,
  LogOut,
  Bookmark,
  ListVideo,
  Home,
  Film,
  Grid3X3,
  Users,
  Calendar
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DEFAULT_SITE_NAME } from '../config/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';
import SafeAvatar from '@/components/SafeAvatar';

// Lazy load SearchSuggestions - only needed when search is opened
const SearchSuggestions = lazy(() => import('@/components/SearchSuggestions'));

export default function Navbar() {
  const { user, logout, searchQuery, setSearchQuery, bookmarks, watchlist, animeList } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [siteLogo, setSiteLogo] = useState('/images/logo-150.webp');
  const rafId = useRef<number | null>(null);
  const lastScrolled = useRef(false);

  // Load site settings from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem('siteName');
    const storedLogo = localStorage.getItem('siteLogo');
    if (storedName) setSiteName(storedName);
    // Use stored logo if available, otherwise keep default logo
    if (storedLogo) setSiteLogo(storedLogo);

    // Listen for storage changes (from other tabs)
    const handleStorageChange = () => {
      const name = localStorage.getItem('siteName');
      const logo = localStorage.getItem('siteLogo');
      if (name) setSiteName(name);
      if (logo) setSiteLogo(logo);
      // Also update favicon
      const favicon = localStorage.getItem('siteFavicon') || logo;
      if (favicon) {
        const faviconLink = document.getElementById('site-favicon') as HTMLLinkElement;
        if (faviconLink) faviconLink.href = `${favicon}?v=${Date.now()}`;
      }
    };

    // Listen for custom event (from same tab)
    const handleLogoUpdate = (e: CustomEvent) => {
      setSiteLogo(e.detail);
      // Also update favicon
      localStorage.setItem('siteFavicon', e.detail);
      const faviconLink = document.getElementById('site-favicon') as HTMLLinkElement;
      if (faviconLink) faviconLink.href = `${e.detail}?v=${Date.now()}`;
    };

    // Listen for BroadcastChannel messages
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('site-settings');
      bc.onmessage = (event) => {
        if (event.data.type === 'logoUpdated') {
          setSiteLogo(event.data.logo);
          // Also update favicon
          localStorage.setItem('siteFavicon', event.data.logo);
          const faviconLink = document.getElementById('site-favicon') as HTMLLinkElement;
          if (faviconLink) faviconLink.href = `${event.data.logo}?v=${Date.now()}`;
        }
      };
    }

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('siteLogoUpdated', handleLogoUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('siteLogoUpdated', handleLogoUpdate as EventListener);
      bc?.close();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = window.requestAnimationFrame(() => {
        const next = window.scrollY > 50;
        if (next !== lastScrolled.current) {
          lastScrolled.current = next;
          setIsScrolled(next);
        }
        rafId.current = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (rafId.current !== null) window.cancelAnimationFrame(rafId.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Listen for global search trigger from BottomNav
  useEffect(() => {
    const handleOpenSearch = () => {
      setIsSearchOpen(true);
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('openGlobalSearch', handleOpenSearch);
    return () => window.removeEventListener('openGlobalSearch', handleOpenSearch);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/anime-list', label: 'Anime List', icon: Film },
    { path: '/movies', label: 'Movies', icon: Grid3X3 },
    { path: '/schedule', label: 'Jadwal', icon: Calendar },
    { path: '/community', label: 'Community', icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? 'bg-[#0F0F1A]/90 backdrop-blur-md md:backdrop-blur-xl shadow-lg shadow-black/20'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${siteLogo ? 'bg-transparent' : 'bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF]'}`}>
                {siteLogo ? (
                  <img src={siteLogo} alt={siteName} className="w-full h-full object-contain" />
                ) : (
                  <Film className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-xl font-bold font-heading hidden sm:block text-white">
                {siteName}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link px-4 py-2 text-sm font-medium transition-colors ${isActive(link.path)
                    ? 'text-white'
                    : 'text-white/60 hover:text-white'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Source Switcher */}


              {/* Search Button - Desktop Only */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:block p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Search className="w-5 h-5 text-white/70" />
              </button>

              {/* Notifications - Social */}
              {user && <NotificationDropdown />}

              {/* User Menu - Desktop Only */}
              {user ? (
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <SafeAvatar
                          src={user.avatar}
                          name={user.name}
                          className="w-8 h-8 rounded-lg"
                          fallbackBgClassName={user.isAdmin ? 'bg-gradient-to-br from-red-500 to-rose-600' : undefined}
                          fallbackClassName="text-sm"
                        />
                        <span className="text-sm font-medium hidden md:block">{user.name}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#1A1A2E] border-white/10">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-white/50">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={() => navigate('/profile')}
                        className="text-white/70 hover:text-white focus:bg-white/5 cursor-pointer"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profil Saya
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/bookmarks')}
                        className="text-white/70 hover:text-white focus:bg-white/5 cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4 mr-2" />
                        Bookmark
                        {bookmarks.length > 0 && (
                          <span className="ml-auto text-xs bg-[#6C5DD3] px-2 py-0.5 rounded-full">
                            {bookmarks.length}
                          </span>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/watchlist')}
                        className="text-white/70 hover:text-white focus:bg-white/5 cursor-pointer"
                      >
                        <ListVideo className="w-4 h-4 mr-2" />
                        Watchlist
                        {watchlist.length > 0 && (
                          <span className="ml-auto text-xs bg-[#6C5DD3] px-2 py-0.5 rounded-full">
                            {watchlist.length}
                          </span>
                        )}
                      </DropdownMenuItem>
                      {user.isAdmin && (
                        <>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => navigate('/admin')}
                            className="text-white/70 hover:text-white focus:bg-white/5 cursor-pointer"
                          >
                            <Grid3X3 className="w-4 h-4 mr-2" />
                            Admin Panel
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={logout}
                        className="text-red-400 hover:text-red-300 focus:bg-red-500/10 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Keluar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="hidden sm:flex text-white/70 hover:text-white hover:bg-white/5"
                  >
                    Masuk
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] hover:opacity-90 text-white"
                  >
                    Daftar
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button - Only on small screens */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 lg:hidden"
          >
            <div className="bg-[#0F0F1A]/95 backdrop-blur-xl border-b border-white/10 p-4">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive(link.path)
                      ? 'bg-[#6C5DD3]/20 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="max-w-2xl mx-auto mt-24 sm:mt-32 px-4"
              onClick={e => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/50 z-10" />
                <input
                  type="text"
                  placeholder="Cari anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-14 pr-14 py-4 bg-[#1A1A2E] border border-white/10 rounded-2xl text-white text-lg placeholder-white/30 focus:outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/20"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>

              {/* Autocomplete Suggestions - Lazy loaded with Suspense */}
              <Suspense fallback={null}>
                <SearchSuggestions
                  searchQuery={searchQuery}
                  animeList={animeList}
                  onSelect={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  onViewAll={() => {
                    navigate(`/anime-list?search=${encodeURIComponent(searchQuery)}`);
                    setIsSearchOpen(false);
                  }}
                />
              </Suspense>

              <p className="mt-4 text-center text-white/40 text-sm">
                Tekan Enter untuk mencari atau ESC untuk menutup
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
