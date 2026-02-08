// BottomNav - Floating mobile navigation (optimized for performance)
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Compass, Calendar, User, Users, Film, X } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home', isSearch: false },
  { path: '/search', icon: Search, label: 'Cari', isSearch: true },
  { path: '/schedule', icon: Calendar, label: 'Jadwal', isSearch: false },
  { path: '/profile', icon: User, label: 'Profile', isSearch: false },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Don't show on certain pages
  const hideOnPaths = ['/watch', '/login', '/register'];
  if (hideOnPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Handle search button click - trigger global search
  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('openGlobalSearch'));
  };

  // Handle explore selection
  const handleExploreSelect = (path: string) => {
    setIsExploreOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Explore Modal - CSS only animation */}
      {isExploreOpen && (
        <div
          className="fixed inset-0 z-50 sm:hidden animate-fade-in"
          onClick={() => setIsExploreOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal Content - Slide up animation */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1A1A2E] rounded-t-3xl border-t border-white/10 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Jelajahi</h2>
              <button
                onClick={() => setIsExploreOpen(false)}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Options */}
            <div className="p-6 space-y-3">
              {/* Anime Option */}
              <button
                onClick={() => handleExploreSelect('/anime-list')}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-[#6C5DD3]/20 to-transparent rounded-2xl border border-[#6C5DD3]/30 hover:border-[#6C5DD3] hover:from-[#6C5DD3]/30 transition-all group active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center shadow-lg shadow-[#6C5DD3]/20 group-hover:scale-110 transition-transform">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-white font-semibold block">Anime</span>
                  <span className="text-white/50 text-sm">Jelajahi daftar anime</span>
                </div>
              </button>
              
              {/* Community Option */}
              <button
                onClick={() => handleExploreSelect('/community')}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-white/5 to-transparent rounded-2xl border border-white/10 hover:border-white/30 hover:from-white/10 transition-all group active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-[#6C5DD3]" />
                </div>
                <div className="text-left">
                  <span className="text-white font-semibold block">Komunitas</span>
                  <span className="text-white/50 text-sm">Diskusi dengan pengguna lain</span>
                </div>
              </button>
            </div>
            
            {/* Safe area padding */}
            <div className="h-[env(safe-area-inset-bottom,20px)]" />
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden pointer-events-none flex justify-center">
        {/* Floating container - centered with max width */}
        <div className="mx-auto mb-5 px-4 w-full max-w-[380px] pointer-events-auto">
          <div 
            className={`relative rounded-2xl border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.3)] px-2 py-2 transition-all duration-500 ${
              isExploreOpen ? 'bg-[#0F0F1A]/50' : 'bg-[#0F0F1A]/85 backdrop-blur-xl'
            } ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90'}`}
          >
            <div className="relative flex items-center justify-between">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                // For search button
                if (item.isSearch) {
                  return (
                    <button
                      key={item.label}
                      onClick={handleSearchClick}
                      className="group relative flex flex-col items-center justify-center min-w-[64px] py-1.5 active:scale-95 transition-transform"
                    >
                      <div 
                        className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                          active 
                            ? 'bg-white/10 text-white' 
                            : 'text-white/30 group-hover:text-white/50'
                        }`}
                      >
                        <Icon 
                          className={`w-[18px] h-[18px] transition-all duration-200 ${
                            active ? 'stroke-[2px]' : 'stroke-[1.5px]'
                          }`} 
                        />
                      </div>
                      <span className={`text-[10px] font-medium transition-all duration-200 mt-0.5 ${
                        active 
                          ? 'text-white/80' 
                          : 'text-white/30 group-hover:text-white/50'
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  );
                }
                
                const targetPath = item.path;

                return (
                  <Link
                    key={item.label}
                    to={targetPath}
                    className="group relative flex flex-col items-center justify-center min-w-[64px] py-1.5 active:scale-95 transition-transform"
                  >
                    <div 
                      className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                        active 
                          ? 'bg-white/10 text-white' 
                          : 'text-white/30 group-hover:text-white/50'
                      }`}
                    >
                      <Icon 
                        className={`w-[18px] h-[18px] transition-all duration-200 ${
                          active ? 'stroke-[2px]' : 'stroke-[1.5px]'
                        }`} 
                      />
                    </div>
                    <span className={`text-[10px] font-medium transition-all duration-200 mt-0.5 ${
                      active 
                        ? 'text-white/80' 
                        : 'text-white/30 group-hover:text-white/50'
                    }`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              
              {/* Explore Button - Center */}
              <button
                onClick={() => setIsExploreOpen(true)}
                className="group relative flex flex-col items-center justify-center min-w-[64px] py-1.5 active:scale-95 transition-transform"
              >
                <div 
                  className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                    isExploreOpen
                      ? 'bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] text-white shadow-lg shadow-[#6C5DD3]/30' 
                      : 'text-white/30 group-hover:text-white/50'
                  }`}
                >
                  <Compass 
                    className={`w-[18px] h-[18px] transition-all duration-200 ${
                      isExploreOpen ? 'stroke-[2px]' : 'stroke-[1.5px]'
                    }`} 
                  />
                </div>
                <span className={`text-[10px] font-medium transition-all duration-200 mt-0.5 ${
                  isExploreOpen 
                    ? 'text-white' 
                    : 'text-white/30 group-hover:text-white/50'
                }`}>
                  Explore
                </span>
              </button>
            </div>
          </div>
          
          {/* Safe area padding */}
          <div className="h-[env(safe-area-inset-bottom,8px)]" />
        </div>
      </nav>
    </>
  );
}
