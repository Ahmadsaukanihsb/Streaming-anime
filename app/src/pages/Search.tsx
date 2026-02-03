import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, Loader2, Grid3X3, List, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import AnimeCard from '@/components/AnimeCard';
import { BACKEND_URL } from '@/config/api';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedGenres, toggleGenre, selectedYear, setSelectedYear, selectedStatus, setSelectedStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating' | 'az'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Update search query from URL
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchQuery(q);
  }, [searchParams]);

  // Fetch from API
  useEffect(() => {
    const fetchResults = async () => {
      const q = searchParams.get('q');
      if (!q) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const url = `${BACKEND_URL}/api/anime/search-otaku/${encodeURIComponent(q)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();

        // Normalize Data
        const normalized = data.map((item: any) => {
          let slug = item.slug;
          if (!slug && item.url) {
            const parts = item.url.split('/').filter((p: string) => p);
            slug = parts[parts.length - 1];
          }
          if (!slug) slug = item.id || Math.random().toString();

          return {
            id: slug,
            title: item.title,
            poster: item.poster || item.thumb || item.img || 'https://via.placeholder.com/300x450?text=No+Image',
            studio: item.studio || 'Unknown',
            rating: parseFloat(item.score) || 0,
            episodes: item.episodes || 0,
            genres: item.genres || [],
            status: item.status || 'Unknown',
            releasedYear: item.release || 0,
            type: item.type || 'TV',
            source: item.source
          };
        });

        setSearchResults(normalized);
      } catch (err) {
        console.error('Search API Error:', err);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  // Filter and sort anime (Client Side on API results)
  const filteredAnime = useMemo(() => {
    let result = [...searchResults];

    // Genre filter
    if (selectedGenres.length > 0) {
      result = result.filter((anime) =>
        selectedGenres.some((genre) =>
          anime.genres.some((g: string) => g.toLowerCase().includes(genre.toLowerCase()))
        )
      );
    }

    // Year filter
    if (selectedYear) {
      result = result.filter((anime) => anime.releasedYear == selectedYear);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((anime) => anime.status.toLowerCase() === selectedStatus.toLowerCase());
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => (b.releasedYear || 0) - (a.releasedYear || 0));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [searchResults, selectedGenres, selectedYear, selectedStatus, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    selectedGenres.forEach((g) => toggleGenre(g));
    setSelectedYear(null);
    setSelectedStatus('all');
  };

  const hasActiveFilters = selectedGenres.length > 0 || selectedYear || selectedStatus !== 'all';

  return (
    <main className="min-h-screen bg-[#0F0F1A] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-heading text-white mb-2">
            {searchParams.get('q') ? `Hasil Pencarian` : 'Cari Anime'}
          </h1>
          <p className="text-white/50">
            {searchParams.get('q')
              ? `Menampilkan hasil untuk "${searchParams.get('q')}"`
              : 'Temukan anime favoritmu dengan koleksi terlengkap'}
          </p>
        </motion.div>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A2E] border border-white/5 rounded-2xl p-4 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Cari anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchParams({});
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </form>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
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
              {selectedGenres.map((genre) => (
                <span key={genre} className="px-3 py-1 bg-[#6C5DD3]/20 text-[#6C5DD3] text-sm rounded-full">
                  {genre}
                </span>
              ))}
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

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/50">
            Menampilkan <span className="text-white font-medium">{filteredAnime.length}</span> anime
          </p>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#6C5DD3] animate-spin mb-4" />
              <p className="text-white/50">Mencari anime...</p>
            </div>
          ) : filteredAnime.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredAnime.map((anime, index) => (
                  <AnimeCard key={`${anime.id}-${index}`} anime={anime} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnime.map((anime, index) => (
                  <motion.div
                    key={`${anime.id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/anime/${anime.id}`}
                      className="flex gap-4 p-4 bg-[#1A1A2E] border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                    >
                      <img
                        src={anime.poster}
                        alt={anime.title}
                        className="w-20 h-28 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{anime.title}</h3>
                        <p className="text-sm text-white/50 mt-1">{anime.studio}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-sm text-yellow-400">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {anime.rating?.toFixed(2) || '0.00'}
                          </span>
                          <span className="text-white/30">•</span>
                          <span className="text-sm text-white/50">{anime.episodes || '?'} EPS</span>
                          <span className="text-white/30">•</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${anime.status === 'Ongoing'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400'
                            }`}>
                            {anime.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {anime.genres.slice(0, 3).map((genre: string) => (
                            <span key={genre} className="px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded-full">
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchParams.get('q') ? 'Tidak ada anime ditemukan' : 'Mulai Pencarian'}
              </h3>
              <p className="text-white/50">
                {searchParams.get('q') ? 'Coba kata kunci lain atau ubah filter' : 'Ketik judul anime di kolom pencarian'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
