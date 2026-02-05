import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Grid3X3, Sparkles, Film, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import AnimeCard from '@/components/AnimeCard';
import Seo from '@/components/Seo';

// Genre icons/colors mapping
const genreStyles: Record<string, { color: string; gradient: string }> = {
    'Action': { color: '#EF4444', gradient: 'from-red-500 to-orange-500' },
    'Adventure': { color: '#F59E0B', gradient: 'from-amber-500 to-yellow-500' },
    'Comedy': { color: '#FBBF24', gradient: 'from-yellow-400 to-amber-400' },
    'Drama': { color: '#8B5CF6', gradient: 'from-purple-500 to-violet-500' },
    'Fantasy': { color: '#6366F1', gradient: 'from-indigo-500 to-purple-500' },
    'Horror': { color: '#1F2937', gradient: 'from-gray-800 to-gray-900' },
    'Mystery': { color: '#6B7280', gradient: 'from-gray-500 to-gray-700' },
    'Romance': { color: '#EC4899', gradient: 'from-pink-500 to-rose-500' },
    'Sci-Fi': { color: '#06B6D4', gradient: 'from-cyan-500 to-blue-500' },
    'Slice of Life': { color: '#10B981', gradient: 'from-emerald-500 to-teal-500' },
    'Sports': { color: '#F97316', gradient: 'from-orange-500 to-red-500' },
    'Supernatural': { color: '#A855F7', gradient: 'from-purple-500 to-pink-500' },
    'Thriller': { color: '#DC2626', gradient: 'from-red-600 to-rose-700' },
    'School': { color: '#3B82F6', gradient: 'from-blue-500 to-indigo-500' },
    'Martial Arts': { color: '#EAB308', gradient: 'from-yellow-500 to-orange-500' },
    'Mecha': { color: '#64748B', gradient: 'from-slate-500 to-gray-600' },
    'Music': { color: '#A78BFA', gradient: 'from-violet-400 to-purple-500' },
    'Psychological': { color: '#7C3AED', gradient: 'from-violet-600 to-purple-700' },
    'Historical': { color: '#92400E', gradient: 'from-amber-700 to-yellow-800' },
    'Dark Fantasy': { color: '#4C1D95', gradient: 'from-purple-900 to-violet-800' },
    'Ninja': { color: '#1E3A8A', gradient: 'from-blue-900 to-indigo-800' },
    'Superhero': { color: '#0EA5E9', gradient: 'from-sky-500 to-blue-600' },
};

const defaultGradient = 'from-[#6C5DD3] to-[#8B7EE5]';

export default function Genres() {
    const { animeList } = useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Read genre from URL query parameter
    useEffect(() => {
        const genreParam = searchParams.get('genre');
        if (genreParam) {
            setSelectedGenre(genreParam);
        } else {
            setSelectedGenre(null);
        }
    }, [searchParams]);

    // Get all unique genres with anime count
    const genresWithCount = useMemo(() => {
        const genreMap = new Map<string, number>();
        animeList.forEach(anime => {
            anime.genres.forEach((genre: string) => {
                genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
            });
        });
        return Array.from(genreMap.entries())
            .map(([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count);
    }, [animeList]);

    // Filter anime by selected genre
    const filteredAnime = useMemo(() => {
        if (!selectedGenre) return [];
        return animeList.filter(anime =>
            anime.genres.some((g: string) => g.toLowerCase() === selectedGenre.toLowerCase())
        );
    }, [animeList, selectedGenre]);

    // Filter genres by search
    const filteredGenres = useMemo(() => {
        if (!searchQuery) return genresWithCount;
        return genresWithCount.filter(({ genre }) =>
            genre.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [genresWithCount, searchQuery]);

    const handleGenreClick = (genre: string) => {
        navigate(`/genres?genre=${encodeURIComponent(genre)}`);
    };

    const handleBackToGenres = () => {
        navigate('/genres');
        setSelectedGenre(null);
    };

    return (
        <main className="min-h-screen bg-[#0F0F1A] pt-20">
            <Seo
                title="Genre Anime"
                description="Jelajahi anime berdasarkan genre favoritmu di Animeku. Action, romance, fantasy, dan banyak lagi."
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Show genre grid if no genre selected */}
                {!selectedGenre ? (
                    <>
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center">
                                    <Grid3X3 className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold font-heading text-white">
                                    Jelajahi Genre
                                </h1>
                            </div>
                            <p className="text-white/50 ml-13">
                                Pilih genre favoritmu dan temukan anime yang sesuai
                            </p>
                        </motion.div>

                        {/* Search Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mb-8"
                        >
                            <div className="relative max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="text"
                                    placeholder="Cari genre..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                                />
                            </div>
                        </motion.div>

                        {/* Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="flex items-center gap-6 mb-8 p-4 bg-[#1A1A2E] border border-white/5 rounded-xl"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#6C5DD3]" />
                                <span className="text-white font-medium">{genresWithCount.length}</span>
                                <span className="text-white/50">Genre tersedia</span>
                            </div>
                            <div className="w-px h-5 bg-white/10" />
                            <div className="flex items-center gap-2">
                                <Film className="w-5 h-5 text-[#00C2FF]" />
                                <span className="text-white font-medium">{animeList.length}</span>
                                <span className="text-white/50">Total Anime</span>
                            </div>
                        </motion.div>

                        {/* Genre Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredGenres.map(({ genre, count }, index) => {
                                const style = genreStyles[genre] || { gradient: defaultGradient };
                                return (
                                    <motion.button
                                        key={genre}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        onClick={() => handleGenreClick(genre)}
                                        className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:scale-105 hover:shadow-2xl"
                                        style={{
                                            background: `linear-gradient(135deg, ${style.color}20, ${style.color}05)`,
                                            border: `1px solid ${style.color}30`,
                                        }}
                                    >
                                        {/* Background gradient on hover */}
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                                        />

                                        {/* Content */}
                                        <div className="relative z-10">
                                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-white transition-colors">
                                                {genre}
                                            </h3>
                                            <p className="text-white/50 text-sm group-hover:text-white/80 transition-colors">
                                                {count} Anime
                                            </p>
                                        </div>

                                        {/* Decorative element */}
                                        <div
                                            className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
                                            style={{ backgroundColor: style.color }}
                                        />
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {filteredGenres.length === 0 && (
                            <div className="text-center py-20">
                                <Search className="w-16 h-16 mx-auto mb-4 text-white/20" />
                                <h3 className="text-xl font-semibold text-white mb-2">Genre tidak ditemukan</h3>
                                <p className="text-white/50">Coba kata kunci lain</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Selected Genre View */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
                                <button onClick={handleBackToGenres} className="hover:text-white transition-colors">
                                    Genres
                                </button>
                                <span>/</span>
                                <span className="text-white/60">{selectedGenre}</span>
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div
                                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${genreStyles[selectedGenre]?.gradient || defaultGradient} flex items-center justify-center`}
                                        >
                                            <TrendingUp className="w-5 h-5 text-white" />
                                        </div>
                                        <h1 className="text-3xl font-bold font-heading text-white">
                                            {selectedGenre}
                                        </h1>
                                    </div>
                                    <p className="text-white/50">
                                        Menampilkan {filteredAnime.length} anime dengan genre {selectedGenre}
                                    </p>
                                </div>

                                <button
                                    onClick={handleBackToGenres}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                    Semua Genre
                                </button>
                            </div>
                        </motion.div>

                        {/* Anime Grid */}
                        {filteredAnime.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {filteredAnime.map((anime, index) => (
                                    <AnimeCard key={anime.id} anime={anime} index={index} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <Film className="w-16 h-16 mx-auto mb-4 text-white/20" />
                                <h3 className="text-xl font-semibold text-white mb-2">Tidak ada anime</h3>
                                <p className="text-white/50 mb-4">Belum ada anime dengan genre {selectedGenre}</p>
                                <button
                                    onClick={handleBackToGenres}
                                    className="px-6 py-3 bg-[#6C5DD3] hover:bg-[#5a4ec0] rounded-xl text-white transition-colors"
                                >
                                    Kembali ke Genres
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
