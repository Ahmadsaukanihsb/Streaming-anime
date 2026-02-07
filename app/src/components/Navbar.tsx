import { useState, useEffect, useRef } from 'react';
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

export default function Navbar() {
  const { user, logout, searchQuery, setSearchQuery, bookmarks, watchlist, animeList } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [siteLogo, setSiteLogo] = useState('');
  const rafId = useRef<number | null>(null);
  const lastScrolled = useRef(false);
  
  // Load site settings from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem('siteName');
    const storedLogo = localStorage.getItem('siteLogo');
    if (storedName) setSiteName(storedName);
    if (storedLogo) setSiteLogo(storedLogo);
    
    // Listen for storage changes (from other tabs)
    const handleStorageChange = () => {
      const name = localStorage.getItem('siteName');
      const logo = localStorage.getItem('siteLogo');
      if (name) setSiteName(name);
      if (logo) setSiteLogo(logo);
    };
    
    // Listen for custom event (from same tab)
    const handleLogoUpdate = (e: CustomEvent) => {
      setSiteLogo(e.detail);
    };
    
    // Listen for BroadcastChannel messages
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('site-settings');
      bc.onmessage = (event) => {
        if (event.data.type === 'logoUpdated') {
          setSiteLogo(event.data.logo);
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center overflow-hidden">
                {siteLogo ? (
                  <img src={siteLogo} alt={siteName} className="w-full h-full object-cover" />
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

              {/* Mobile Menu Button - Hidden (using BottomNav instead) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hidden lg:block p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
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

              {/* Autocomplete Suggestions */}
              {searchQuery.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-[#1A1A2E] border border-white/10 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto"
                >
                  {animeList
                    .filter(anime =>
                      anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      anime.titleJp?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 6)
                    .map((anime) => (
                      <Link
                        key={anime.id}
                        to={`/anime/${anime.id}`}
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                      >
                        <img
                          src={anime.poster}
                          alt={anime.title}
                          className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium line-clamp-1">{anime.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-white/50 text-sm">{anime.releasedYear}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${anime.status === 'Ongoing' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {anime.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium">{anime.rating}</span>
                        </div>
                      </Link>
                    ))}
                  {animeList.filter(anime =>
                    anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    anime.titleJp?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                      <div className="p-6 text-center">
                        <p className="text-white/50">Tidak ada hasil untuk "{searchQuery}"</p>
                      </div>
                    )}
                  {animeList.filter(anime =>
                    anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    anime.titleJp?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/anime-list?search=${encodeURIComponent(searchQuery)}`);
                          setIsSearchOpen(false);
                        }}
                        className="w-full p-3 text-center text-sm text-[#6C5DD3] hover:bg-white/5 transition-colors border-t border-white/5"
                      >
                        Lihat semua hasil untuk "{searchQuery}"
                      </button>
                    )}
                </motion.div>
              )}

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
