import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/anime-list', icon: Search, label: 'Cari' },
  { path: '/schedule', icon: Calendar, label: 'Jadwal' },
  { path: '/profile', icon: User, label: 'Profile' },
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden pointer-events-none">
      {/* Floating container */}
      <div className="mx-4 mb-4 pointer-events-auto">
        <motion.div 
          className="bg-[#1A1A2E]/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/50 px-2 py-2"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.8 }}
        >
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              const targetPath = item.label === 'Jadwal' && !user 
                ? '/login' 
                : item.path;

              return (
                <Link
                  key={item.label}
                  to={targetPath}
                  className="relative flex flex-col items-center py-2 px-3"
                >
                  {/* Active pill background */}
                  {active && (
                    <motion.div
                      layoutId="bottomNavPill"
                      className="absolute inset-0 bg-[#6C5DD3] rounded-2xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  {/* Icon container */}
                  <motion.div 
                    className={`relative z-10 p-2 rounded-xl transition-all duration-200 ${
                      active 
                        ? 'text-white' 
                        : 'text-white/50 hover:text-white/70'
                    }`}
                    whileTap={{ scale: 0.85 }}
                  >
                    <Icon 
                      className={`w-5 h-5 transition-all duration-200 ${
                        active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                      }`} 
                    />
                  </motion.div>
                  
                  {/* Label */}
                  <span className={`relative z-10 text-[10px] font-medium transition-all duration-200 mt-0.5 ${
                    active 
                      ? 'text-white font-semibold' 
                      : 'text-white/50'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.div>
        
        {/* Safe area padding */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </nav>
  );
}
