// BottomNav - Floating mobile navigation (subtle design)
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home', isSearch: false },
  { path: '/anime-list', icon: Search, label: 'Cari', isSearch: true },
  { path: '/schedule', icon: Calendar, label: 'Jadwal', isSearch: false },
  { path: '/profile', icon: User, label: 'Profile', isSearch: false },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useApp();

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden pointer-events-none flex justify-center">
      {/* Floating container - centered with max width */}
      <div className="mx-auto mb-5 px-4 w-full max-w-[340px] pointer-events-auto">
        <motion.div 
          className="relative bg-[#0F0F1A]/85 backdrop-blur-xl rounded-2xl border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.3)] px-2 py-2"
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.25, duration: 0.7 }}
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
                    className="group relative flex flex-col items-center justify-center min-w-[70px] py-1.5"
                  >
                    {/* Icon container - subtle active state */}
                    <motion.div 
                      className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                        active 
                          ? 'bg-white/10 text-white' 
                          : 'text-white/30 group-hover:text-white/50'
                      }`}
                      whileTap={{ scale: 0.92 }}
                    >
                      <Icon 
                        className={`w-[18px] h-[18px] transition-all duration-200 ${
                          active ? 'stroke-[2px]' : 'stroke-[1.5px]'
                        }`} 
                      />
                    </motion.div>
                    
                    {/* Label - subtle color */}
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
              
              const targetPath = item.label === 'Jadwal' && !user 
                ? '/login' 
                : item.path;

              return (
                <Link
                  key={item.label}
                  to={targetPath}
                  className="group relative flex flex-col items-center justify-center min-w-[70px] py-1.5"
                >
                  {/* Icon container - subtle active state */}
                  <motion.div 
                    className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                      active 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/30 group-hover:text-white/50'
                    }`}
                    whileTap={{ scale: 0.92 }}
                  >
                    <Icon 
                      className={`w-[18px] h-[18px] transition-all duration-200 ${
                        active ? 'stroke-[2px]' : 'stroke-[1.5px]'
                      }`} 
                    />
                  </motion.div>
                  
                  {/* Label - subtle color */}
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
          </div>
        </motion.div>
        
        {/* Safe area padding */}
        <div className="h-[env(safe-area-inset-bottom,8px)]" />
      </div>
    </nav>
  );
}
