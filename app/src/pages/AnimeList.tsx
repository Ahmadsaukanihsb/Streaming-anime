import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Search, Grid3X3, List, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import AnimeCard from '@/components/AnimeCard';
import { Button } from '@/components/ui/button';

function getPageTitle(searchParams: URLSearchParams): string {
  const genre = searchParams.get('genre');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  
  if (search) return `Pencarian: ${search}`;
  if (genre) return `Genre: ${genre}`;
  if (status === 'ongoing') return 'Anime Ongoing';
  if (status === 'completed') return 'Anime Completed';
  return 'Daftar Anime';
}

function getPageDescription(searchParams: URLSearchParams): string {
  const genre = searchParams.get('genre');
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  
  if (search) return `Hasil pencarian anime ${search} subtitle Indonesia. Streaming dan download gratis kualitas HD.`;
  if (genre) return `Koleksi anime genre ${genre} subtitle Indonesia terlengkap. Streaming dan download gratis kualitas HD.`;
  if (status === 'ongoing') return 'Daftar anime ongoing yang sedang tayang. Streaming subtitle Indonesia gratis kualitas HD.';
  if (status === 'completed') return 'Daftar anime completed yang sudah tamat. Streaming subtitle Indonesia gratis kualitas HD.';
  return 'Jelajahi koleksi anime subtitle Indonesia terlengkap. Filter berdasarkan genre, tahun, status, dan rating.';
}
import { StaticPageSEO } from '@/components/Seo';

export default function AnimeList() {
  const { animeList } = useApp();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Ongoing' | 'Completed'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating' | 'az'>('newest');
  

  // Read query parameters from URL on mount and when URL changes
  useEffect(() => {
    const genreParam = searchParams.get('genre');
    const searchParam = searchParams.get('search');
    const statusParam = searchParams.get('status');
    const sortParam = searchParams.get('sort');

    if (genreParam) {
      setSelectedGenre(genreParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (statusParam === 'ongoing') {
      setSelectedStatus('Ongoing');
    } else if (statusParam === 'completed') {
      setSelectedStatus('Completed');
    }
    if (sortParam === 'rating') {
      setSortBy('rating');
    } else if (sortParam === 'popular') {
      setSortBy('popular');
    }
  }, [searchParams, location.pathname]);

  // Dynamically extract unique genres from animeList
  const genres = useMemo(() => {
    const allGenres = animeList.flatMap(anime => anime.genres);
    return Array.from(new Set(allGenres)).sort();
  }, [animeList]);

  // Dynamically extract unique years from animeList
  const years = useMemo(() => {
    const allYears = animeList.map(anime => anime.releasedYear);
    return Array.from(new Set(allYears)).sort((a, b) => b - a);
  }, [animeList]);

  const filteredAnime = useMemo(() => {
    let result = [...animeList];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (anime) =>
          anime.title.toLowerCase().includes(query) ||
          anime.studio.toLowerCase().includes(query)
      );
    }

    // Genre filter
    if (selectedGenre !== 'all') {
      result = result.filter((anime) => anime.genres.includes(selectedGenre));
    }

    // Year filter
    if (selectedYear) {
      result = result.filter((anime) => anime.releasedYear === selectedYear);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((anime) => anime.status === selectedStatus);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => b.releasedYear - a.releasedYear);
        break;
      case 'popular':
        result.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [animeList, searchQuery, selectedGenre, selectedYear, selectedStatus, sortBy]);

  const clearFilters = () => {
    setSelectedGenre('all');
    setSelectedYear(null);
    setSelectedStatus('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedGenre !== 'all' || selectedYear || selectedStatus !== 'all' || searchQuery;

  const pageTitle = getPageTitle(searchParams);
  const pageDescription = getPageDescription(searchParams);
  const canonicalUrl = `/anime-list${location.search}`;

  return (
    <main className="min-h-screen bg-[#0F0F1A] pt-16 sm:pt-20 pb-20">
      <StaticPageSEO
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalUrl}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:hidden mb-4"
        >
          <h1 className="text-xl font-bold text-white">
            {location.pathname === '/genres' && selectedGenre !== 'all'
              ? selectedGenre
              : 'Daftar Anime'}
          </h1>
          <p className="text-white/50 text-sm">
            {filteredAnime.length} anime ditemukan
          </p>
        </motion.div>

        {/* Desktop Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden sm:block mb-8"
        >
          <h1 className="text-3xl font-bold font-heading text-white mb-2">
            {location.pathname === '/genres' && selectedGenre !== 'all'
              ? `Anime Genre: ${selectedGenre}`
              : location.pathname === '/genres'
                ? 'Semua Genre'
                : 'Daftar Anime'}
          </h1>
          <p className="text-white/50">
            {selectedGenre !== 'all'
              ? `Menampilkan anime dengan genre ${selectedGenre}`
              : 'Jelajahi koleksi anime terlengkap dengan kualitas terbaik'}
          </p>
        </motion.div>

        {/* Mobile Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sm:hidden mb-4"
        >
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Cari anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-shrink-0 px-3 py-2 bg-[#1A1A2E] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#6C5DD3]"
            >
              <option value="newest">Terbaru</option>
              <option value="popular">Terpopuler</option>
              <option value="rating">Rating</option>
              <option value="az">A-Z</option>
            </select>

            {/* Genre */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="flex-shrink-0 px-3 py-2 bg-[#1A1A2E] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#6C5DD3]"
            >
              <option value="all">Semua Genre</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            {/* Year */}
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
              className="flex-shrink-0 px-3 py-2 bg-[#1A1A2E] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#6C5DD3]"
            >
              <option value="">Semua Tahun</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="flex-shrink-0 px-3 py-2 bg-[#1A1A2E] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#6C5DD3]"
            >
              <option value="all">Semua Status</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>

            {/* View Mode */}
            <div className="flex-shrink-0 flex items-center bg-[#1A1A2E] rounded-lg border border-white/10 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#6C5DD3] text-white' : 'text-white/50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[#6C5DD3] text-white' : 'text-white/50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {selectedGenre !== 'all' && (
                <span className="px-2 py-1 bg-[#6C5DD3]/20 text-[#6C5DD3] text-xs rounded-full flex items-center gap-1">
                  {selectedGenre}
                  <button onClick={() => setSelectedGenre('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedYear && (
                <span className="px-2 py-1 bg-[#6C5DD3]/20 text-[#6C5DD3] text-xs rounded-full flex items-center gap-1">
                  {selectedYear}
                  <button onClick={() => setSelectedYear(null)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="px-2 py-1 bg-[#6C5DD3]/20 text-[#6C5DD3] text-xs rounded-full flex items-center gap-1">
                  {selectedStatus}
                  <button onClick={() => setSelectedStatus('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-red-400 text-xs hover:text-red-300"
              >
                Hapus semua
              </button>
            </div>
          )}
        </motion.div>

        {/* Desktop Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden sm:block bg-[#1A1A2E] border border-white/5 rounded-2xl p-4 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Cari anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#6C5DD3]"
              >
                <option value="all" className="bg-[#1A1A2E]">Semua Genre</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre} className="bg-[#1A1A2E]">
                    {genre}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#6C5DD3]"
              >
                <option value="" className="bg-[#1A1A2E]">Semua Tahun</option>
                {years.map((year) => (
                  <option key={year} value={year} className="bg-[#1A1A2E]">
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#6C5DD3]"
              >
                <option value="all" className="bg-[#1A1A2E]">Semua Status</option>
                <option value="Ongoing" className="bg-[#1A1A2E]">Ongoing</option>
                <option value="Completed" className="bg-[#1A1A2E]">Completed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#6C5DD3]"
              >
                <option value="newest" className="bg-[#1A1A2E]">Terbaru</option>
                <option value="popular" className="bg-[#1A1A2E]">Terpopuler</option>
                <option value="rating" className="bg-[#1A1A2E]">Rating Tertinggi</option>
                <option value="az" className="bg-[#1A1A2E]">A-Z</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#6C5DD3] text-white' : 'text-white/50'
                    }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#6C5DD3] text-white' : 'text-white/50'
                    }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
              <span className="text-white/50 text-sm">Filter aktif:</span>
              {selectedGenre !== 'all' && (
                <span className="px-3 py-1 bg-[#6C5DD3]/20 text-[#6C5DD3] text-sm rounded-full">
                  {selectedGenre}
                </span>
              )}
              {selectedYear && (
                <span className="px-3 py-1 bg-[#6C5DD3]/20 text-[#6C5DD3] text-sm rounded-full">
                  {selectedYear}
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="px-3 py-1 bg-[#6C5DD3]/20 text-[#6C5DD3] text-sm rounded-full">
                  {selectedStatus}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-red-400 text-sm hover:text-red-300 ml-auto"
              >
                Hapus Filter
              </button>
            </div>
          )}
        </motion.div>

        {/* Results Count - Desktop */}
        <div className="hidden sm:flex items-center justify-between mb-6">
          <p className="text-white/50">
            Menampilkan <span className="text-white font-medium">{filteredAnime.length}</span> anime
          </p>
        </div>

        {/* Anime Grid/List */}
        {filteredAnime.length > 0 ? (
          viewMode === 'grid' ? (
            // Mobile: 3 columns, Desktop: responsive
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {filteredAnime.map((anime, index) => (
                <AnimeCard key={anime.id} anime={anime} index={index} />
              ))}
            </div>
          ) : (
            // List View - Mobile optimized
            <div className="space-y-3 sm:space-y-4">
              {filteredAnime.map((anime, index) => (
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/anime/${anime.id}`}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-[#1A1A2E] border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                  >
                    <img
                      src={anime.poster}
                      alt={anime.title}
                      className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-lg font-semibold text-white hover:text-[#6C5DD3] transition-colors line-clamp-1">
                            {anime.title}
                          </h3>
                          {anime.titleJp && (
                            <p className="text-white/50 text-xs sm:text-sm line-clamp-1">{anime.titleJp}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-yellow-500/20 text-yellow-400 rounded-lg flex-shrink-0">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-medium text-xs sm:text-sm">{anime.rating}</span>
                        </div>
                      </div>

                      <p className="text-white/50 text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-1 sm:line-clamp-2">{anime.synopsis}</p>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-4">
                        <span className={`px-2 py-0.5 text-[10px] sm:text-xs rounded-full ${anime.status === 'Ongoing'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400'
                          }`}>
                          {anime.status}
                        </span>
                        <span className="text-white/40 text-xs sm:text-sm">{anime.episodes} Ep</span>
                        <span className="text-white/40 text-xs sm:text-sm">{anime.releasedYear}</span>
                        <span className="text-white/40 text-xs sm:text-sm hidden sm:inline">{anime.studio}</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                        {anime.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="px-2 py-0.5 bg-white/5 text-white/60 text-[10px] sm:text-xs rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                        {anime.genres.length > 3 && (
                          <span className="px-2 py-0.5 bg-white/5 text-white/60 text-[10px] sm:text-xs rounded-full">
                            +{anime.genres.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12 sm:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-white/5 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-white/30" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Tidak ada anime ditemukan
            </h3>
            <p className="text-white/50 text-sm sm:text-base mb-4 sm:mb-6">
              Coba ubah kata kunci pencarian atau filter yang digunakan
            </p>
            <Button onClick={clearFilters} className="bg-[#6C5DD3] hover:bg-[#5a4ec0] text-sm sm:text-base">
              Hapus Filter
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
