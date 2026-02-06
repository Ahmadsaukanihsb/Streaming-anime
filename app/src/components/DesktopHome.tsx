// DesktopHome - Minimalist layout for desktop
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight, TrendingUp, Clock, Star, Calendar, Play, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import type { Anime } from '@/data/animeData';
import { useApp } from '@/context/AppContext';
import OptimizedImage from '@/components/OptimizedImage';
import ScheduleWidget from '@/components/ScheduleWidget';
import StatusBadge from '@/components/StatusBadge';
import type { SidebarWidget } from '@/types';

interface DesktopHomeProps {
  trendingAnime: Anime[];
  ongoingAnime: Anime[];
  latestAnime: Anime[];
  topRatedAnime: Anime[];
  completedAnime: Anime[];
  popularGenres: string[];
  sidebarWidgets: SidebarWidget[];
}

// Minimalist Anime Card with Hover Detail
function AnimeCard({ anime, index }: { anime: Anime; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'right' | 'left'>('right');

  const handleMouseEnter = () => {
    // Determine if card is near right edge
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const isNearRightEdge = rect.right + 320 > windowWidth; // 320 is tooltip width
      setTooltipPosition(isNearRightEdge ? 'left' : 'right');
    }
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex-shrink-0 w-[180px] relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/anime/${anime.id}`} className="block">
        {/* Poster */}
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
          <OptimizedImage
            src={anime.poster}
            alt={anime.title}
            aspectRatio="poster"
            className="transition-all duration-500 group-hover:scale-105"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-current" />
            </div>
          </div>

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <StatusBadge status={anime.status} variant="solid" />
          </div>

          {/* Rating */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-[10px] font-medium text-white">{anime.rating}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2 text-sm font-medium text-white/90 line-clamp-1 group-hover:text-white transition-colors">
          {anime.title}
        </h3>
        <p className="text-xs text-white/40 mt-0.5">{anime.episodes} Episodes</p>
      </Link>

      {/* Hover Detail Tooltip */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: tooltipPosition === 'right' ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`absolute top-0 ${tooltipPosition === 'right' ? 'left-full ml-3' : 'right-full mr-3'} z-50 w-[280px]`}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-[#1A1A2E]/98 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <OptimizedImage
                  src={anime.poster}
                  alt={anime.title}
                  aspectRatio="poster"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white line-clamp-2 mb-1">
                  {anime.title}
                </h4>
                <p className="text-xs text-white/50 mb-2">{anime.titleJp || ''}</p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-yellow-400">
                    <Star className="w-3 h-3 fill-current" />
                    {anime.rating}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-xs text-white/50">{anime.releasedYear}</span>
                </div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-2 mb-3">
              <StatusBadge status={anime.status} variant="subtle" className="!text-[10px] !px-2 !py-1" />
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/60">
                {anime.episodes} Episodes
              </span>
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/60">
                {anime.studio}
              </span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-1 mb-3">
              {anime.genres.slice(0, 4).map((genre) => (
                <span key={genre} className="text-[10px] px-2 py-0.5 bg-white/5 text-white/50 rounded">
                  {genre}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-xs text-white/60 line-clamp-3 mb-3">
              {anime.synopsis}
            </p>

            {/* Watch Button */}
            <div className="flex items-center gap-2">
              <span className="flex-1 text-center py-2 bg-[#6C5DD3] hover:bg-[#5a4ec0] text-white text-xs font-medium rounded-lg transition-colors">
                Tonton Sekarang
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Horizontal Row Section with drag support
function RowSection({ 
  title, 
  subtitle,
  animeList, 
  icon: Icon,
  viewAllLink,
  limit = 12 
}: { 
  title: string;
  subtitle?: string;
  animeList: Anime[];
  icon: any;
  viewAllLink: string;
  limit?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -720 : 720;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const displayAnime = animeList.slice(0, limit);
  if (displayAnime.length === 0) return null;

  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-white/30" />
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Scroll buttons */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-1.5 rounded-full transition-all ${
              canScrollLeft 
                ? 'bg-white/10 text-white/70 hover:bg-white/20' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-1.5 rounded-full transition-all ${
              canScrollRight 
                ? 'bg-white/10 text-white/70 hover:bg-white/20' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Link 
            to={viewAllLink}
            className="ml-4 text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
          >
            Lihat Semua
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Horizontal scroll with drag support */}
      <div 
        ref={scrollRef}
        className={`flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {displayAnime.map((anime, index) => (
          <AnimeCard key={anime.id} anime={anime} index={index} />
        ))}
      </div>
    </section>
  );
}

// Continue Watching Card
function ContinueCard({ anime }: { anime: Anime }) {
  return (
    <Link 
      to={`/anime/${anime.id}`}
      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
    >
      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        <OptimizedImage
          src={anime.poster}
          alt={anime.title}
          aspectRatio="poster"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white/90 line-clamp-1 group-hover:text-white transition-colors">
          {anime.title}
        </h4>
        <p className="text-xs text-white/40 mt-0.5">Episode 5 • 12m left</p>
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-[60%] bg-[#6C5DD3] rounded-full" />
        </div>
      </div>
    </Link>
  );
}

export default function DesktopHome({
  trendingAnime,
  ongoingAnime,
  latestAnime,
  topRatedAnime,
  completedAnime,
  popularGenres,
  sidebarWidgets,
}: DesktopHomeProps) {
  const { animeList, user } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Search suggestions
  const searchSuggestions = searchQuery.length >= 2
    ? animeList
      .filter(anime =>
        anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        anime.titleJp?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5)
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/anime-list?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Minimalist Header with Search */}
      <header className="sticky top-0 z-40 bg-[#0F0F1A]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-current" />
              </div>
              <span className="text-lg font-bold text-white">AnimeStream</span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Cari anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-full pl-9 pr-8 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3]/50 focus:bg-white/[0.07] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Search suggestions */}
              {searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#16162a] border border-white/5 rounded-xl shadow-2xl overflow-hidden">
                  {searchSuggestions.map((anime) => (
                    <Link
                      key={anime.id}
                      to={`/anime/${anime.id}`}
                      onClick={() => setSearchQuery('')}
                      className="flex items-center gap-3 p-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                    >
                      <OptimizedImage
                        src={anime.poster}
                        alt={anime.title}
                        aspectRatio="poster"
                        containerClassName="w-8 h-11 flex-shrink-0 rounded overflow-hidden"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm line-clamp-1">{anime.title}</p>
                        <span className="text-white/40 text-xs">{anime.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </form>

            {/* Quick filters */}
            <div className="flex items-center gap-1">
              {popularGenres.slice(0, 4).map((genre) => (
                <Link
                  key={genre}
                  to={`/anime-list?genre=${genre}`}
                  className="px-3 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-8">
          {/* Left Content */}
          <div className="flex-1 min-w-0">
            {/* Trending Row - First Section */}
            <RowSection
              title="Trending Minggu Ini"
              subtitle="Anime paling populer saat ini"
              animeList={trendingAnime}
              icon={TrendingUp}
              viewAllLink="/anime-list?sort=trending"
              limit={12}
            />

            {/* Ongoing Row */}
            <RowSection
              title="Sedang Tayang"
              subtitle="Update terbaru setiap minggu"
              animeList={ongoingAnime}
              icon={Clock}
              viewAllLink="/anime-list?status=ongoing"
              limit={12}
            />

            {/* Latest Row */}
            <RowSection
              title="Update Terbaru"
              subtitle="Episode baru yang baru saja rilis"
              animeList={latestAnime}
              icon={Calendar}
              viewAllLink="/anime-list?sort=latest"
              limit={12}
            />

            {/* Top Rated Row */}
            <RowSection
              title="Top Rating"
              subtitle="Anime dengan rating tertinggi"
              animeList={topRatedAnime}
              icon={Star}
              viewAllLink="/anime-list?sort=rating"
              limit={12}
            />

            {/* Completed Row */}
            <RowSection
              title="Anime Selesai"
              subtitle="Sudah tamat, bisa marathon!"
              animeList={completedAnime}
              icon={Play}
              viewAllLink="/anime-list?status=completed"
              limit={12}
            />
          </div>

          {/* Right Sidebar */}
          <aside className="w-72 flex-shrink-0 space-y-6">
            {/* Schedule Widget */}
            {sidebarWidgets.find(w => w.id === 'schedule')?.enabled && (
              <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                <ScheduleWidget />
              </div>
            )}

            {/* Continue Watching */}
            {user && ongoingAnime.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-white/30" />
                  <h3 className="text-sm font-semibold text-white">Lanjutkan</h3>
                </div>
                <div className="space-y-2">
                  {ongoingAnime.slice(0, 4).map((anime) => (
                    <ContinueCard key={anime.id} anime={anime} />
                  ))}
                </div>
              </div>
            )}

            {/* Top Rating Mini - Bigger Cards */}
            <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-white/30" />
                <h3 className="text-sm font-semibold text-white">Top Rating</h3>
              </div>
              <div className="space-y-3">
                {topRatedAnime.slice(0, 5).map((anime, index) => (
                  <Link
                    key={anime.id}
                    to={`/anime/${anime.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className={`w-6 text-center text-sm font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-amber-600' :
                      'text-white/20'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <OptimizedImage
                        src={anime.poster}
                        alt={anime.title}
                        aspectRatio="poster"
                        className="transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white/90 line-clamp-1 group-hover:text-white transition-colors">
                        {anime.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                          <Star className="w-3 h-3 fill-current" />
                          {anime.rating}
                        </span>
                        <span className="text-xs text-white/30">•</span>
                        <span className="text-xs text-white/40">{anime.episodes} EP</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Random Anime Button */}
            {sidebarWidgets.find(w => w.id === 'random')?.enabled && (
              <Link
                to={`/anime/${animeList[Math.floor(Math.random() * animeList.length)]?.id || ''}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Play className="w-4 h-4" />
                Anime Random
              </Link>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
