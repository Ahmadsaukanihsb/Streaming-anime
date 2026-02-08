import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight } from 'lucide-react';
import type { Anime } from '@/data/animeData';
import { useApp } from '@/context/AppContext';
import AnimeSectionMobile from '@/components/AnimeSectionMobile';
import ScheduleWidget from '@/components/ScheduleWidget';
import OptimizedImage from '@/components/OptimizedImage';
import type { SidebarWidget } from '@/types';
import { getAnimeUrl } from '@/lib/slug';

interface MobileHomeProps {
  trendingAnime: Anime[];
  ongoingAnime: Anime[];
  latestAnime: Anime[];
  topRatedAnime: Anime[];
  completedAnime: Anime[];
  popularGenres: string[];
  sidebarWidgets?: SidebarWidget[];
}

export default function MobileHome({
  trendingAnime,
  ongoingAnime,
  latestAnime,
  topRatedAnime,
  completedAnime,
  popularGenres,
  sidebarWidgets = [],
}: MobileHomeProps) {
  const { animeList, user } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Search suggestions - Memoized untuk performance
  const searchSuggestions = useMemo(() => 
    searchQuery.length >= 2
      ? animeList
        .filter(anime =>
          anime.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          anime.titleJp?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
      : [],
    [searchQuery, animeList]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/anime-list?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-2 pb-20">
      {/* Compact Search & Filter */}
      <section className="px-4 pt-4 pb-2">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Cari anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3] focus:bg-white/10 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search suggestions */}
          {searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1E] border border-white/10 rounded-xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto">
              {searchSuggestions.map((anime) => (
                <Link
                  key={anime.id}
                  to={getAnimeUrl(anime)}
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
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
                </Link>
              ))}
            </div>
          )}
        </form>

        {/* Quick genre filter */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedGenre === null
                ? 'bg-[#6C5DD3] text-white'
                : 'bg-white/5 text-white/60'
            }`}
          >
            Semua
          </button>
          {popularGenres.slice(0, 6).map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedGenre === genre
                  ? 'bg-[#6C5DD3] text-white'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Schedule Widget - Compact (only if enabled) */}
      {sidebarWidgets.find(w => w.id === 'schedule')?.enabled && (
        <section className="px-4">
          <ScheduleWidget />
        </section>
      )}

      {/* Trending - Horizontal Scroll */}
      {!selectedGenre && trendingAnime.length > 0 && (
        <AnimeSectionMobile
          title="Trending"
          animeList={trendingAnime}
          variant="horizontal"
          icon="trending"
          viewAllLink="/anime-list?sort=trending"
          limit={10}
        />
      )}

      {/* Continue Watching - List View */}
      {user && (
        <AnimeSectionMobile
          title="Lanjutkan"
          animeList={ongoingAnime.slice(0, 5)}
          variant="continue"
          icon="clock"
          limit={5}
        />
      )}

      {/* Ongoing - Grid 3 columns */}
      <AnimeSectionMobile
        title={selectedGenre ? `${selectedGenre}` : "Ongoing"}
        animeList={ongoingAnime.filter(a => !selectedGenre || a.genres?.includes(selectedGenre))}
        variant="grid"
        icon="flame"
        viewAllLink="/anime-list?status=ongoing"
        limit={9}
      />

      {/* Latest Update - List View */}
      <AnimeSectionMobile
        title="Update Terbaru"
        animeList={latestAnime}
        variant="list"
        icon="clock"
        viewAllLink="/anime-list?sort=latest"
        limit={6}
      />

      {/* Top Rating - Horizontal Scroll */}
      <AnimeSectionMobile
        title="Top Rating"
        animeList={topRatedAnime}
        variant="horizontal"
        icon="star"
        viewAllLink="/anime-list?sort=rating"
        limit={10}
      />

      {/* Completed - Grid */}
      {!selectedGenre && (
        <AnimeSectionMobile
          title="Selesai"
          animeList={completedAnime}
          variant="grid"
          icon="sparkles"
          viewAllLink="/anime-list?status=completed"
          limit={9}
        />
      )}

      {/* Browse All Button */}
      <section className="px-4 py-4">
        <Link
          to="/anime-list"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          Jelajahi Semua Anime
          <ChevronRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
