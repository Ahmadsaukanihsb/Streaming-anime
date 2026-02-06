import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Bookmark, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/anime-list', icon: Search, label: 'Cari' },
  { path: '/profile', icon: Bookmark, label: 'Watchlist' },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
      {/* Safe area padding for iOS */}
      <div className="bg-[#0F0F1A]/95 backdrop-blur-xl border-t border-white/10 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            // Watchlist redirect to login if not authenticated
            const targetPath = item.label === 'Watchlist' && !user 
              ? '/login' 
              : item.path;

            return (
              <Link
                key={item.label}
                to={targetPath}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'text-[#6C5DD3]'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <div className={`relative p-2 rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-[#6C5DD3]/20' 
                    : 'hover:bg-white/5'
                }`}>
                  <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
                  {active && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#6C5DD3] rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${active ? 'text-[#6C5DD3]' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
