import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, PlayCircle, ChevronRight, TrendingUp } from 'lucide-react';
import Hero from '@/components/Hero';
import AnimeSection from '@/components/AnimeSection';
import ContinueWatching from '@/components/ContinueWatching';
import ScheduleWidget from '@/components/ScheduleWidget';
import UserStatsWidget from '@/components/UserStatsWidget';
import RandomAnimeButton from '@/components/RandomAnimeButton';
import { HomePageSkeleton } from '@/components/SkeletonLoading';
import { HomeSEO } from '@/components/Seo';
import { useApp } from '@/context/AppContext';
import { BACKEND_URL } from '@/config/api';
import { apiFetch } from '@/lib/api';
import OptimizedImage from '@/components/OptimizedImage';

// Sidebar widget config type
interface SidebarWidget {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

interface HomeSection {
  id: 'trending' | 'continue' | 'ongoing' | 'latest' | 'explore' | 'completed';
  name: string;
  enabled: boolean;
}

// Default sidebar widgets - Ideal order for UX
const defaultWidgets: SidebarWidget[] = [
  { id: 'schedule', name: 'Jadwal Rilis', enabled: true, order: 0 },      // Most relevant - upcoming episodes
  { id: 'topRating', name: 'Top Rating', enabled: true, order: 1 },       // Popular content discovery
  { id: 'stats', name: 'Statistik User', enabled: true, order: 2 },       // Personal engagement
  { id: 'random', name: 'Tombol Anime Random', enabled: true, order: 3 }, // Fun discovery
  { id: 'genres', name: 'Genre Populer', enabled: true, order: 4 },       // Browse by category
];

const defaultHomeSections: HomeSection[] = [
  { id: 'trending', name: 'Trending Minggu Ini', enabled: true },
  { id: 'continue', name: 'Lanjutkan Menonton', enabled: true },
  { id: 'ongoing', name: 'Anime Ongoing', enabled: true },
  { id: 'latest', name: 'Update Terbaru', enabled: true },
  { id: 'explore', name: 'Jelajahi Anime', enabled: true },
  { id: 'completed', name: 'Anime Selesai', enabled: false },
];

export default function Home() {
  const { animeList, isLoading } = useApp();
  const navigate = useNavigate();
  const [sidebarWidgets, setSidebarWidgets] = useState<SidebarWidget[]>(defaultWidgets);
  const [homeSections, setHomeSections] = useState<HomeSection[]>(defaultHomeSections);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [trendingAnime, setTrendingAnime] = useState<any[]>([]);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('Cari anime favoritmu...');
  const [caretVisible, setCaretVisible] = useState(true);
  const typingActive = !isSearchFocused && searchQuery.length === 0;
  const sectionStyle: React.CSSProperties = {
    contentVisibility: 'auto',
    containIntrinsicSize: '1px 800px'
  };
  const sidebarSectionStyle: React.CSSProperties = {
    contentVisibility: 'auto',
    containIntrinsicSize: '1px 600px'
  };

  // Search suggestions - filter anime based on query
  const searchSuggestions = searchQuery.length >= 2
    ? animeList
      .filter(anime =>
        anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        anime.titleJp?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5)
    : [];

  // Load homepage settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [widgetsRes, sectionsRes] = await Promise.all([
          apiFetch(`${BACKEND_URL}/api/settings/sidebarWidgets`),
          apiFetch(`${BACKEND_URL}/api/settings/homeSections`),
        ]);

        if (widgetsRes.ok) {
          const data = await widgetsRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setSidebarWidgets(data);
          }
        }

        if (sectionsRes.ok) {
          const data = await sectionsRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setHomeSections(mergeHomeSections(data));
          }
        }
        // 404 is expected if settings don't exist yet - use defaults silently
      } catch (err) {
        // Network error - use defaults
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  // Animated placeholder typing effect (pause when search focused or user typed)
  useEffect(() => {
    if (!typingActive) {
      setAnimatedPlaceholder('Cari anime favoritmu...');
      return;
    }

    const phrases = [
      'Cari anime favoritmu...',
      'Coba "One Piece"...',
      'Cari genre: Action, Romance...',
      'Cari anime terbaru...'
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = phrases[phraseIndex];
      const speed = deleting ? 70 : 100;
      const pause = 1200;

      if (!deleting) {
        charIndex = Math.min(charIndex + 1, current.length);
        setAnimatedPlaceholder(current.slice(0, charIndex));
        if (charIndex === current.length) {
          deleting = true;
          timeoutId = setTimeout(tick, pause);
          return;
        }
      } else {
        charIndex = Math.max(charIndex - 1, 0);
        setAnimatedPlaceholder(current.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timeoutId = setTimeout(tick, 200);
          return;
        }
      }

      timeoutId = setTimeout(tick, speed);
    };

    tick();
    return () => clearTimeout(timeoutId);
  }, [typingActive]);

  // Blinking caret for placeholder (only when typing active)
  useEffect(() => {
    if (!typingActive) {
      setCaretVisible(false);
      return;
    }
    const interval = setInterval(() => {
      setCaretVisible(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, [typingActive]);

  // Fetch weekly trending
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/anime/trending/weekly`);
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

  const mergeHomeSections = (data: HomeSection[]) => {
    const map = new Map(defaultHomeSections.map(section => [section.id, section]));
    data.forEach(section => {
      if (section?.id && map.has(section.id)) {
        map.set(section.id, { ...map.get(section.id)!, ...section });
      }
    });
    return Array.from(map.values());
  };

  const isSectionEnabled = (id: HomeSection['id']) =>
    homeSections.find(section => section.id === id)?.enabled !== false;

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
      <HomeSEO />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#6C5DD3]/20 blur-[140px]" />
          <div className="absolute top-40 right-[-120px] h-[360px] w-[360px] rounded-full bg-[#00C2FF]/20 blur-[140px]" />
          <div className="absolute top-[45%] left-[-140px] h-[320px] w-[320px] rounded-full bg-[#FF6B6B]/10 blur-[140px]" />
        </div>
        <div className="relative z-10">
          <Hero />
        </div>
      </div>

      <div className="relative z-10 bg-[#0F0F1A]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-12">

          <section className="relative z-20 mt-6 sm:mt-8 mb-6 sm:mb-8">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-transparent p-4 sm:p-5 shadow-xl shadow-black/20 backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">Command Center</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">Temukan tontonan malam ini</h2>
                  <p className="text-sm text-white/50 mt-1">Cari cepat, filter genre, langsung tonton.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/60">
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Total: {animeList.length}</div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Ongoing: {ongoingAnime.length}</div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Completed: {completedAnime.length}</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <form onSubmit={handleSearch} className="relative z-30">
                  <div className="relative group">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-white/40 group-focus-within:text-[#6C5DD3] transition-colors z-10" />
                    <input
                      type="text"
                      placeholder={`${animatedPlaceholder}${caretVisible ? '|' : ''}`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 text-sm sm:text-base text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3] focus:bg-white/10 transition-all"
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

                    {isSearchFocused && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1E] border border-white/10 rounded-xl shadow-2xl z-[100] max-h-[60vh] overflow-y-auto">
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
                            <OptimizedImage
                              src={anime.poster}
                              alt={anime.title}
                              aspectRatio="poster"
                              containerClassName="w-10 h-14 flex-shrink-0 rounded-lg overflow-hidden"
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
                <Link
                  to="/anime-list"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Jelajahi Semua
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap sm:overflow-visible">
                <button
                  onClick={() => setSelectedGenre(null)}
                  className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${selectedGenre === null
                    ? 'bg-[#6C5DD3] text-white shadow-md shadow-[#6C5DD3]/20 sm:shadow-lg sm:shadow-[#6C5DD3]/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  Semua
                </button>
                {(popularGenres.length > 0
                  ? popularGenres
                  : ['Action', 'Romance', 'Fantasy', 'Comedy', 'Isekai', 'Slice of Life', 'Adventure', 'Supernatural']
                ).slice(0, 8).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                    className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${selectedGenre === genre
                      ? 'bg-[#6C5DD3] text-white shadow-md shadow-[#6C5DD3]/20 sm:shadow-lg sm:shadow-[#6C5DD3]/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {selectedGenre && (
                <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
                  <span className="px-2 py-1 rounded-full bg-[#6C5DD3]/20 text-[#B7ABFF]">Filter: {selectedGenre}</span>
                  <button onClick={() => setSelectedGenre(null)} className="text-white/40 hover:text-white transition-colors">
                    Reset filter
                  </button>
                </div>
              )}
            </div>
          </section>

          {isSectionEnabled('trending') && trendingAnime.length > 0 && !selectedGenre && (
            <section className="relative z-10 mb-6 sm:mb-8" style={sectionStyle}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FF6B6B] flex items-center justify-center border border-white/10 shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Trending Minggu Ini</h2>
                    <p className="text-sm text-white/50">Anime terpopuler minggu ini.</p>
                  </div>
                </div>
                <Link
                  to="/anime-list?sort=trending"
                  className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  Lihat Semua
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {trendingAnime.map((anime, index) => (
                  <Link
                    key={anime.id}
                    to={`/anime/${anime.id}`}
                    className="group relative"
                  >
                    <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                      <OptimizedImage
                        src={anime.poster}
                        alt={anime.title}
                        aspectRatio="poster"
                        className="group-hover:scale-105"
                        containerClassName="w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-semibold">
                        #{index + 1} Trending
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-xs font-medium line-clamp-2">{anime.title}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Continue Watching - Shows only if user has watch history */}
          {isSectionEnabled('continue') && (
            <div style={sectionStyle}>
              <ContinueWatching />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6 sm:space-y-8">

              {/* Anime Ongoing - Slider */}
              {isSectionEnabled('ongoing') && ongoingAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre)).length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03]" style={sectionStyle}>
                  <AnimeSection
                    title={selectedGenre ? `Ongoing - ${selectedGenre}` : "Anime Ongoing"}
                    subtitle="Anime yang sedang tayang minggu ini"
                    animeList={ongoingAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre))}
                    variant="grid"
                    icon="flame"
                    viewAllLink={`/anime-list?status=ongoing${selectedGenre ? `&genre=${selectedGenre}` : ''}`}
                    limit={12}
                  />
                </div>
              )}

              {/* Update Terbaru - Grid style */}
              {isSectionEnabled('latest') && latestAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre)).length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03]" style={sectionStyle}>
                  <AnimeSection
                    title={selectedGenre ? `Terbaru - ${selectedGenre}` : "Update Terbaru"}
                    subtitle="Anime yang baru ditambahkan"
                    animeList={latestAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre))}
                    variant="grid"
                    icon="clock"
                    viewAllLink={`/anime-list${selectedGenre ? `?genre=${selectedGenre}` : ''}`}
                    limit={8}
                  />
                </div>
              )}

              {/* Semua Anime - Full Grid */}
              {isSectionEnabled('explore') && allAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre)).length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03]" style={sectionStyle}>
                  <AnimeSection
                    title={selectedGenre ? `${selectedGenre} Anime` : "Jelajahi Anime"}
                    subtitle="Temukan anime favoritmu"
                    animeList={allAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre))}
                    variant="grid"
                    icon="trending"
                    viewAllLink={`/anime-list${selectedGenre ? `?genre=${selectedGenre}` : ''}`}
                    limit={12}
                  />
                </div>
              )}

              {/* Completed Anime - Optional */}
              {isSectionEnabled('completed') && completedAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre)).length > 4 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03]" style={sectionStyle}>
                  <AnimeSection
                    title={selectedGenre ? `Selesai - ${selectedGenre}` : "Anime Selesai"}
                    subtitle="Anime yang sudah tamat"
                    animeList={completedAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre)).slice(0, 12)}
                    variant="grid"
                    icon="star"
                    viewAllLink={`/anime-list?status=completed${selectedGenre ? `&genre=${selectedGenre}` : ''}`}
                    limit={6}
                  />
                </div>
              )}
            </div>

            <aside className="w-full">
              <div className="lg:sticky lg:top-24 space-y-4">
                <div className="hidden lg:flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/40">
                  <PlayCircle className="w-4 h-4 text-[#6C5DD3]" />
                  Live Panel
                </div>
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4" style={sidebarSectionStyle}>
                  {sortedWidgets
                    .filter(w => w.enabled && ['schedule', 'random'].includes(w.id))
                    .map(widget => widgetComponents[widget.id])}
                </div>
                <div className="hidden lg:block space-y-6" style={sidebarSectionStyle}>
                  {sortedWidgets
                    .filter(w => w.enabled)
                    .map(widget => widgetComponents[widget.id])}
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </main>
  );
}
