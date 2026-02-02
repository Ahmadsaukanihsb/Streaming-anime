import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp } from 'lucide-react';
import Hero from '@/components/Hero';
import AnimeSection from '@/components/AnimeSection';
import ContinueWatching from '@/components/ContinueWatching';
import ScheduleWidget from '@/components/ScheduleWidget';
import UserStatsWidget from '@/components/UserStatsWidget';
import RandomAnimeButton from '@/components/RandomAnimeButton';
import { HomePageSkeleton } from '@/components/SkeletonLoading';
import { useApp } from '@/context/AppContext';
import { BACKEND_URL } from '@/config/api';

// Sidebar widget config type
interface SidebarWidget {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

// Default sidebar widgets - Ideal order for UX
const defaultWidgets: SidebarWidget[] = [
  { id: 'schedule', name: 'Jadwal Rilis', enabled: true, order: 0 },      // Most relevant - upcoming episodes
  { id: 'topRating', name: 'Top Rating', enabled: true, order: 1 },       // Popular content discovery
  { id: 'stats', name: 'Statistik User', enabled: true, order: 2 },       // Personal engagement
  { id: 'random', name: 'Tombol Anime Random', enabled: true, order: 3 }, // Fun discovery
  { id: 'genres', name: 'Genre Populer', enabled: true, order: 4 },       // Browse by category
];

export default function Home() {
  const { animeList, isLoading } = useApp();
  const navigate = useNavigate();
  const [sidebarWidgets, setSidebarWidgets] = useState<SidebarWidget[]>(defaultWidgets);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [trendingAnime, setTrendingAnime] = useState<any[]>([]);

  // Search suggestions - filter anime based on query
  const searchSuggestions = searchQuery.length >= 2
    ? animeList
      .filter(anime =>
        anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        anime.titleJp?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5)
    : [];

  // Load sidebar widget config from database
  useEffect(() => {
    const loadWidgets = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/settings/sidebarWidgets`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSidebarWidgets(data);
          }
        }
        // 404 is expected if settings don't exist yet - use defaults silently
      } catch (err) {
        // Network error - use defaults
      }
    };
    loadWidgets();
  }, []);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  // Fetch weekly trending
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/anime/trending/weekly`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setTrendingAnime(data.slice(0, 6));
            return;
          }
        }
      } catch (err) {
        // Fall back to views-based sorting
      }
      // Fallback: use total views if weekly data is empty
      const fallback = [...animeList]
        .sort((a, b) => ((b as any).views || 0) - ((a as any).views || 0))
        .slice(0, 6);
      setTrendingAnime(fallback);
    };

    if (animeList.length > 0) {
      fetchTrending();
    }
  }, [animeList]);

  // Filter and sort anime dynamically (using spread to avoid mutation)
  // Sort ongoing anime by lastEpisodeUpload (most recent episode update first)
  const ongoingAnime = [...animeList]
    .filter(a => a.status === 'Ongoing')
    .sort((a, b) => {
      const dateA = (a as any).lastEpisodeUpload ? new Date((a as any).lastEpisodeUpload).getTime() : 0;
      const dateB = (b as any).lastEpisodeUpload ? new Date((b as any).lastEpisodeUpload).getTime() : 0;
      return dateB - dateA;
    });
  const completedAnime = animeList.filter(a => a.status === 'Completed');
  const topRatedAnime = [...animeList].sort((a, b) => b.rating - a.rating).slice(0, 10);

  // Sort by createdAt if available, otherwise use original order (most recent first from API)
  const latestAnime = [...animeList]
    .sort((a, b) => {
      const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 8);

  const allAnime = animeList.slice(0, 12);

  // Extract popular genres dynamically from anime data
  const popularGenres = [...new Set(
    animeList
      .flatMap(anime => anime.genres || [])
      .filter(Boolean)
  )]
    .slice(0, 8); // Top 8 genres

  // Get sorted enabled widgets
  const sortedWidgets = [...sidebarWidgets].sort((a, b) => a.order - b.order);

  // Loading State - Skeleton
  if (isLoading) {
    return <HomePageSkeleton />;
  }

  // Widget components mapping
  const widgetComponents: Record<string, React.ReactNode> = {
    random: <RandomAnimeButton key="random" />,
    stats: <UserStatsWidget key="stats" />,
    schedule: <ScheduleWidget key="schedule" />,
    topRating: (
      <AnimeSection
        key="topRating"
        title="Top Rating"
        animeList={topRatedAnime}
        variant="sidebar-list"
        icon="star"
        viewAllLink="/anime-list?sort=rating"
      />
    ),
    genres: (
      <div key="genres" className="hidden lg:block p-5 bg-white/5 rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4">Genre Populer</h3>
        <div className="flex flex-wrap gap-2">
          {popularGenres.length > 0 ? (
            popularGenres.map(genre => (
              <Link
                key={genre}
                to={`/anime-list?genre=${genre}`}
                className="px-3 py-1.5 text-sm bg-white/5 hover:bg-[#6C5DD3]/20 text-white/70 hover:text-white rounded-full transition-colors"
              >
                {genre}
              </Link>
            ))
          ) : (
            // Fallback to hardcoded if no genres in data
            ['Action', 'Romance', 'Fantasy', 'Comedy', 'Isekai', 'Slice of Life', 'Adventure', 'Supernatural'].map(genre => (
              <Link
                key={genre}
                to={`/anime-list?genre=${genre}`}
                className="px-3 py-1.5 text-sm bg-white/5 hover:bg-[#6C5DD3]/20 text-white/70 hover:text-white rounded-full transition-colors"
              >
                {genre}
              </Link>
            ))
          )}
        </div>
      </div>
    ),
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/anime-list?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F0F1A]">
      {/* Hero Section */}
      <Hero />

      {/* Content Grid */}
      <div className="relative z-10 bg-[#0F0F1A]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-12">

          {/* Quick Search & Filter Bar */}
          <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-white/40 group-focus-within:text-[#6C5DD3] transition-colors z-10" />
                <input
                  type="text"
                  placeholder="Cari anime favoritmu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3] focus:bg-white/10 transition-all text-center"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Autocomplete Dropdown */}
                {isSearchFocused && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A2E] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
                    {searchSuggestions.map((anime) => (
                      <Link
                        key={anime.id}
                        to={`/anime/${anime.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                      >
                        <img
                          src={anime.poster}
                          alt={anime.title}
                          className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm line-clamp-1">{anime.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-white/50 text-xs">{anime.releasedYear}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${anime.status === 'Ongoing' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {anime.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-medium">{anime.rating}</span>
                        </div>
                      </Link>
                    ))}
                    <button
                      type="submit"
                      className="w-full p-3 text-center text-sm text-[#6C5DD3] hover:bg-white/5 transition-colors"
                    >
                      Lihat semua hasil untuk "{searchQuery}"
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* Genre Filter Chips - horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-start sm:justify-center sm:flex-wrap">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${selectedGenre === null
                  ? 'bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
              >
                Semua
              </button>
              {popularGenres.slice(0, 6).map(genre => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                  className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${selectedGenre === genre
                    ? 'bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Trending Section */}
          {trendingAnime.length > 0 && !selectedGenre && (
            <div className="mb-4 sm:mb-8">
              <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-[#FF6B6B]" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Trending Minggu Ini</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-3">
                {trendingAnime.map((anime, index) => (
                  <Link
                    key={anime.id}
                    to={`/anime/${anime.id}`}
                    className="group relative"
                  >
                    <div className="aspect-[2/3] rounded-lg sm:rounded-xl overflow-hidden bg-white/5">
                      <img
                        src={anime.poster}
                        alt={anime.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Rank Badge */}
                      <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 w-6 sm:w-8 h-6 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xs sm:text-sm">#{index + 1}</span>
                      </div>
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {/* Title */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                        <p className="text-white text-xs sm:text-sm font-medium line-clamp-2">{anime.title}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Continue Watching - Shows only if user has watch history */}
          <ContinueWatching />

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

            {/* Main Content (Left) */}
            <div className="flex-1 min-w-0 space-y-6 sm:space-y-8 lg:space-y-10">

              {/* Anime Ongoing - Slider */}
              {ongoingAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre)).length > 0 && (
                <AnimeSection
                  title={selectedGenre ? `Ongoing - ${selectedGenre}` : "Anime Ongoing"}
                  subtitle="Anime yang sedang tayang minggu ini"
                  animeList={ongoingAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre))}
                  variant="slider"
                  icon="flame"
                  viewAllLink={`/anime-list?status=ongoing${selectedGenre ? `&genre=${selectedGenre}` : ''}`}
                  limit={15}
                />
              )}

              {/* Update Terbaru - Grid style */}
              {latestAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre)).length > 0 && (
                <AnimeSection
                  title={selectedGenre ? `Terbaru - ${selectedGenre}` : "Update Terbaru"}
                  subtitle="Anime yang baru ditambahkan"
                  animeList={latestAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre))}
                  variant="grid"
                  icon="clock"
                  viewAllLink={`/anime-list${selectedGenre ? `?genre=${selectedGenre}` : ''}`}
                  limit={8}
                />
              )}

              {/* Semua Anime - Full Grid */}
              {allAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre)).length > 0 && (
                <AnimeSection
                  title={selectedGenre ? `${selectedGenre} Anime` : "Jelajahi Anime"}
                  subtitle="Temukan anime favoritmu"
                  animeList={allAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre))}
                  variant="grid"
                  icon="trending"
                  viewAllLink={`/anime-list${selectedGenre ? `?genre=${selectedGenre}` : ''}`}
                  limit={12}
                />
              )}

              {/* Completed Anime - Optional */}
              {completedAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre)).length > 4 && (
                <AnimeSection
                  title={selectedGenre ? `Selesai - ${selectedGenre}` : "Anime Selesai"}
                  subtitle="Anime yang sudah tamat"
                  animeList={completedAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre)).slice(0, 12)}
                  variant="grid"
                  icon="star"
                  viewAllLink={`/anime-list?status=completed${selectedGenre ? `&genre=${selectedGenre}` : ''}`}
                  limit={6}
                />
              )}
            </div>

            {/* Sidebar (Right) - Shows at bottom on mobile, sticky on desktop */}
            <div className="w-full lg:w-80 flex-shrink-0 mt-8 lg:mt-0">
              <div className="lg:sticky lg:top-24 space-y-3 sm:space-y-5">
                {/* Mobile: Show only schedule and random button */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedWidgets
                    .filter(w => w.enabled && ['schedule', 'random'].includes(w.id))
                    .map(widget => widgetComponents[widget.id])}
                </div>
                {/* Desktop: Show all widgets */}
                <div className="hidden lg:block space-y-6">
                  {sortedWidgets
                    .filter(w => w.enabled)
                    .map(widget => widgetComponents[widget.id])}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
