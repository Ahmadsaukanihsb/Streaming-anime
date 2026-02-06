import { useState } from 'react';
import { Film, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import AnimeCard from '@/components/AnimeCard';
import { StaticPageSEO } from '@/components/Seo';

export default function Movies() {
    const { animeList, isLoading } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

    // Filter movies (type === 'Movie' or episodes === 1)
    const movies = animeList.filter(anime =>
        anime.type === 'Movie' ||
        (anime.episodes === 1 && anime.status === 'Completed')
    );

    // Get unique genres from movies
    const genres = [...new Set(movies.flatMap(m => m.genres || []))].filter(Boolean);

    // Filter based on search and genre
    const filteredMovies = movies.filter(movie => {
        const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = !selectedGenre || movie.genres?.includes(selectedGenre);
        return matchesSearch && matchesGenre;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0F0F1A] pt-24 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-[#6C5DD3] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0F0F1A] pt-20 pb-12">
            <StaticPageSEO
                title="Film Anime Sub Indo"
                description="Koleksi film anime sub indo terbaik di Animeku. Streaming atau download film anime kualitas HD secara gratis."
                canonical="/movies"
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center">
                            <Film className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">Anime Movies</h1>
                    </div>
                    <p className="text-white/60 max-w-2xl mx-auto">
                        Koleksi film anime terbaik dari berbagai genre. Nikmati cerita lengkap dalam satu tontonan!
                    </p>
                </motion.div>

                {/* Search & Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            placeholder="Cari movie..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                        />
                    </div>

                    {/* Genre Filter */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedGenre(null)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedGenre
                                ? 'bg-[#6C5DD3] text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                        >
                            Semua
                        </button>
                        {genres.slice(0, 6).map(genre => (
                            <button
                                key={genre}
                                onClick={() => setSelectedGenre(genre === selectedGenre ? null : genre)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedGenre === genre
                                    ? 'bg-[#6C5DD3] text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 mb-8 text-white/60 text-sm">
                    <span className="flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        {filteredMovies.length} Movies
                    </span>
                </div>

                {/* Movies Grid */}
                {filteredMovies.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    >
                        {filteredMovies.map((movie, index) => (
                            <motion.div
                                key={movie.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <AnimeCard anime={movie} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-20">
                        <Film className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Tidak ada movie ditemukan</h3>
                        <p className="text-white/60">
                            {searchQuery || selectedGenre
                                ? 'Coba ubah filter pencarian Anda'
                                : 'Belum ada movie yang ditambahkan'}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
