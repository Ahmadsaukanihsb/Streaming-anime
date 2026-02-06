import { Link } from 'react-router-dom';
import { Play, Star, ChevronRight } from 'lucide-react';
import type { Anime } from '@/data/animeData';
import { motion } from 'framer-motion';
import OptimizedImage from '@/components/OptimizedImage';
import StatusBadge from '@/components/StatusBadge';
import { THEME } from '@/config/theme';

interface AnimeCardMobileProps {
  anime: Anime;
  variant?: 'list' | 'compact' | 'poster';
  index?: number;
  progress?: number; // For continue watching
  episodeTitle?: string;
}

// List view - Poster kecil + info di samping (untuk Continue Watching, Latest Update)
function ListView({ anime, index = 0, progress, episodeTitle }: AnimeCardMobileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        to={`/anime/${anime.id}`}
        className="group flex gap-3 p-2 rounded-xl bg-white/[0.03] active:bg-white/[0.08] transition-colors"
      >
        {/* Poster - Small */}
        <div className="relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden">
          <OptimizedImage
            src={anime.poster}
            alt={anime.title}
            aspectRatio="poster"
            className="transition-transform duration-300 group-active:scale-105"
          />
          {/* Progress bar for continue watching */}
          {progress !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div 
                className="h-full" 
                style={{ backgroundColor: THEME.colors.primary, width: `${progress}%` }}
              />
            </div>
          )}
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-current" />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center flex-1 min-w-0 py-0.5">
          <h3 className="font-semibold text-white text-sm line-clamp-2 leading-tight group-active:text-[var(--color-primary)] transition-colors" style={{ ['--color-primary' as string]: THEME.colors.primary }}>
            {anime.title}
          </h3>
          
          {episodeTitle && (
            <p className="text-xs text-white/50 mt-1 line-clamp-1">
              {episodeTitle}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {/* Rating */}
            <span className="flex items-center gap-0.5 text-xs text-yellow-400">
              <Star className="w-3 h-3 fill-current" />
              {anime.rating}
            </span>
            
            {/* Status */}
            <StatusBadge status={anime.status} variant="subtle" className="!text-[10px] !px-1.5 !py-0.5 !rounded" />
          </div>

          {/* Episodes count */}
          <p className="text-xs text-white/40 mt-1.5">
            {anime.episodes} Episode
          </p>

          {/* Genres - max 2 */}
          <div className="flex items-center gap-1 mt-1.5">
            {anime.genres.slice(0, 2).map((genre) => (
              <span key={genre} className="text-[10px] text-white/40">
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center self-center text-white/20">
          <ChevronRight className="w-5 h-5" />
        </div>
      </Link>
    </motion.div>
  );
}

// Compact view - Just poster + rating badge (untuk Trending, For You)
function CompactView({ anime, index = 0 }: AnimeCardMobileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className="group"
    >
      <Link to={`/anime/${anime.id}`} className="block">
        {/* Poster */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5">
          <OptimizedImage
            src={anime.poster}
            alt={anime.title}
            aspectRatio="poster"
            className="transition-transform duration-300 group-active:scale-105"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Rating */}
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded-md">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
            <span className="text-[10px] font-medium text-white">{anime.rating}</span>
          </div>

          {/* Status - Small badge */}
          <div className="absolute top-1.5 left-1.5">
            <StatusBadge status={anime.status} variant="solid" className="!text-[8px] !px-1 !py-0" />
          </div>

          {/* Title at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <h3 className="font-medium text-white text-xs line-clamp-2 leading-tight">
              {anime.title}
            </h3>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Poster only view - For horizontal scroll sections
function PosterView({ anime, index = 0 }: AnimeCardMobileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex-shrink-0 w-28"
    >
      <Link to={`/anime/${anime.id}`} className="block">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5">
          <OptimizedImage
            src={anime.poster}
            alt={anime.title}
            aspectRatio="poster"
            className="transition-transform duration-300 group-active:scale-105"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-current" />
          </div>

          {/* Rating badge */}
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-md">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
            <span className="text-[10px] font-medium text-white">{anime.rating}</span>
          </div>
        </div>
        <h3 className="font-medium text-white text-xs mt-2 line-clamp-1">
          {anime.title}
        </h3>
      </Link>
    </motion.div>
  );
}

export default function AnimeCardMobile({ 
  anime, 
  variant = 'list', 
  index = 0,
  progress,
  episodeTitle 
}: AnimeCardMobileProps) {
  if (variant === 'compact') {
    return <CompactView anime={anime} index={index} />;
  }
  
  if (variant === 'poster') {
    return <PosterView anime={anime} index={index} />;
  }

  return (
    <ListView 
      anime={anime} 
      index={index} 
      progress={progress} 
      episodeTitle={episodeTitle} 
    />
  );
}
