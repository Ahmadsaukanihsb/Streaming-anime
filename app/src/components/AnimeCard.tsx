import { Link } from 'react-router-dom';
import { Play, Star, Bookmark, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Anime } from '@/data/animeData';
import { useApp } from '@/context/AppContext';

interface AnimeCardProps {
  anime: Anime;
  variant?: 'default' | 'compact' | 'horizontal';
  index?: number;
}

export default function AnimeCard({ anime, variant = 'default', index = 0 }: AnimeCardProps) {
  const { bookmarks, toggleBookmark } = useApp();
  const isBookmarked = bookmarks.includes(anime.id);

  if (variant === 'horizontal') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group flex gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
      >
        <Link to={`/anime/${anime.id}`} className="relative flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden">
          <img
            src={anime.poster}
            alt={anime.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-current" />
          </div>
        </Link>
        <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
          <div>
            <h3 className="font-semibold text-white truncate group-hover:text-[#6C5DD3] transition-colors">
              {anime.title}
            </h3>
            <p className="text-sm text-white/50 mt-1">{anime.studio}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-sm text-yellow-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                {anime.rating}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-sm text-white/50">{anime.episodes} EPS</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {anime.genres.slice(0, 2).map((genre) => (
              <span key={genre} className="px-2 py-0.5 text-xs bg-white/10 text-white/60 rounded-full">
                {genre}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        className="group relative"
      >
        <Link to={`/anime/${anime.id}`} className="block relative aspect-[3/4] rounded-xl overflow-hidden">
          <img
            src={anime.poster}
            alt={anime.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Rating Badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-[2px] sm:backdrop-blur-sm rounded-lg">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs font-semibold text-white">{anime.rating}</span>
          </div>

          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${anime.status === 'Ongoing'
              ? 'bg-green-500/80 text-white'
              : 'bg-blue-500/80 text-white'
              }`}>
              {anime.status}
            </span>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-[#6C5DD3] transition-colors">
              {anime.title}
            </h3>
            <p className="text-xs text-white/60 mt-1">{anime.episodes} Episodes</p>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-[#6C5DD3]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-[2px] sm:backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-current" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative"
    >
      <Link to={`/anime/${anime.id}`} className="block relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1f1f2e]">
        <img
          src={anime.poster}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent opacity-60" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
          {/* Status Badge */}
          {anime.status && (
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md shrink-0 ${anime.status === 'Ongoing'
              ? 'bg-green-500 text-black'
              : 'bg-blue-500 text-white'
              }`}>
              {anime.status === 'Ongoing' ? 'ONGOING' : 'COMPLETED'}
            </span>
          )}

          {/* Rating Badge */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-[2px] sm:backdrop-blur-md rounded-md border border-white/10 shrink-0">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-bold text-white">{anime.rating?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Bookmark (Hover Only) */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleBookmark(anime.id);
          }}
          className={`absolute top-12 right-3 p-2 rounded-full backdrop-blur-[2px] sm:backdrop-blur-md transition-all duration-300 ${isBookmarked
            ? 'bg-[#6C5DD3] text-white opacity-100'
            : 'bg-black/40 text-white hover:bg-white hover:text-black opacity-0 group-hover:opacity-100'
            }`}
        >
          {isBookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 pt-10 bg-gradient-to-t from-black via-black/80 to-transparent">
          <h3 className="font-bold text-white text-[13px] line-clamp-2 leading-snug group-hover:text-[#6C5DD3] transition-colors mb-1.5">
            {anime.title}
          </h3>

          <div className="flex items-center justify-between text-[10px] text-white/60">
            <div className="flex items-center gap-2">
              {/* Type Badge */}
              {anime.type && (
                <span className={`px-1.5 py-0.5 font-semibold rounded text-[9px] uppercase ${anime.type === 'Movie'
                    ? 'bg-purple-500/80 text-white'
                    : anime.type === 'OVA' || anime.type === 'ONA'
                      ? 'bg-orange-500/80 text-white'
                      : anime.type === 'Special'
                        ? 'bg-pink-500/80 text-white'
                        : 'bg-cyan-500/80 text-white'
                  }`}>
                  {anime.type}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[#6C5DD3]" />
                {anime.episodes ? `${anime.episodes} EP` : '? EP'}
              </span>
            </div>
            <span>{anime.studio || 'Unknown'}</span>
          </div>
        </div>

        {/* Play Icon (Center Hover) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-[#6C5DD3]/90 backdrop-blur-[2px] sm:backdrop-blur-sm flex items-center justify-center shadow-md sm:shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 text-white fill-current ml-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
