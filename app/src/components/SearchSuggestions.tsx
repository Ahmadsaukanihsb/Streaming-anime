import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import { getAnimeUrl } from '@/lib/slug';
import type { Anime } from '@/data/animeData';

interface SearchSuggestionsProps {
    searchQuery: string;
    animeList: Anime[];
    onSelect: (anime: Anime) => void;
    onViewAll: () => void;
}

/**
 * Search suggestions component with debouncing for performance
 * Memoized to prevent unnecessary re-renders
 */
const SearchSuggestions = memo(function SearchSuggestions({
    searchQuery,
    animeList,
    onSelect,
    onViewAll,
}: SearchSuggestionsProps) {
    // Debounce search query to prevent filtering on every keypress
    const debouncedQuery = useDebounce(searchQuery, 200);

    // Memoize filtered results - only recalculates when debounced query changes
    const filteredResults = useMemo(() => {
        if (debouncedQuery.length < 2) return [];

        const query = debouncedQuery.toLowerCase();
        return animeList
            .filter(anime =>
                anime.title.toLowerCase().includes(query) ||
                anime.titleJp?.toLowerCase().includes(query)
            )
            .slice(0, 6);
    }, [debouncedQuery, animeList]);

    // Don't render if query is too short
    if (searchQuery.length < 2) return null;

    // Show loading state while debouncing
    const isDebouncing = searchQuery !== debouncedQuery;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-[#1A1A2E] border border-white/10 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto"
        >
            {isDebouncing ? (
                // Loading skeleton while debouncing
                <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-12 h-16 bg-white/10 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-white/10 rounded w-3/4" />
                                <div className="h-3 bg-white/10 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredResults.length > 0 ? (
                <>
                    {filteredResults.map((anime) => (
                        <Link
                            key={anime.id}
                            to={getAnimeUrl(anime)}
                            onClick={() => onSelect(anime)}
                            className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                        >
                            <img
                                src={anime.poster}
                                alt={anime.title}
                                className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                                loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium line-clamp-1">{anime.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-white/50 text-sm">{anime.releasedYear}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${anime.status === 'Ongoing'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {anime.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400">
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-sm font-medium">{anime.rating}</span>
                            </div>
                        </Link>
                    ))}
                    <button
                        type="button"
                        onClick={onViewAll}
                        className="w-full p-3 text-center text-sm text-[#6C5DD3] hover:bg-white/5 transition-colors border-t border-white/5"
                    >
                        Lihat semua hasil untuk "{debouncedQuery}"
                    </button>
                </>
            ) : (
                <div className="p-6 text-center">
                    <p className="text-white/50">Tidak ada hasil untuk "{debouncedQuery}"</p>
                </div>
            )}
        </motion.div>
    );
});

export default SearchSuggestions;
