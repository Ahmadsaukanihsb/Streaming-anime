import { useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Flame, Clock, Star, TrendingUp, Sparkles } from 'lucide-react';

import type { Anime } from '@/data/animeData';
import AnimeCardMobile from './AnimeCardMobile';

interface AnimeSectionMobileProps {
  title: string;
  subtitle?: string;
  animeList: Anime[];
  variant?: 'horizontal' | 'list' | 'grid' | 'continue';
  icon?: 'flame' | 'clock' | 'star' | 'trending' | 'sparkles';
  viewAllLink?: string;
  limit?: number;
  // For continue watching
  progressData?: { animeId: string; progress: number; episodeTitle: string }[];
}

const icons = {
  flame: Flame,
  clock: Clock,
  star: Star,
  trending: TrendingUp,
  sparkles: Sparkles,
};

const iconColors = {
  flame: 'from-orange-500 to-red-500',
  clock: 'from-cyan-500 to-blue-500',
  star: 'from-yellow-500 to-amber-500',
  trending: 'from-purple-500 to-pink-500',
  sparkles: 'from-[#6C5DD3] to-[#00C2FF]',
};

// Horizontal scroll section (Netflix-style) - Memoized
const HorizontalSection = memo(function HorizontalSection({ 
  title, 
  animeList, 
  icon = 'flame', 
  viewAllLink,
  limit = 10 
}: AnimeSectionMobileProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const Icon = icons[icon];
  const displayAnime = animeList.slice(0, limit);

  return (
    <section className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${iconColors[icon]} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="flex items-center text-xs text-white/50">
            Lihat Semua
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Horizontal Scroll */}
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"
      >
        {displayAnime.map((anime, index) => (
          <AnimeCardMobile 
            key={anime.id} 
            anime={anime} 
            variant="poster"
            index={index}
          />
        ))}
      </div>
    </section>
  );
});

// List view section (for latest, completed) - Memoized
const ListSection = memo(function ListSection({ 
  title, 
  animeList, 
  icon = 'clock', 
  viewAllLink,
  limit = 6 
}: AnimeSectionMobileProps) {
  const Icon = icons[icon];
  const displayAnime = animeList.slice(0, limit);

  return (
    <section className="py-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${iconColors[icon]} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="flex items-center text-xs text-white/50">
            Lihat Semua
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {displayAnime.map((anime, index) => (
          <AnimeCardMobile 
            key={anime.id} 
            anime={anime} 
            variant="list"
            index={index}
          />
        ))}
      </div>
    </section>
  );
});

// Grid section (3 columns, for explore, genres) - Memoized
const GridSection = memo(function GridSection({ 
  title, 
  animeList, 
  icon = 'sparkles', 
  viewAllLink,
  limit = 9 
}: AnimeSectionMobileProps) {
  const Icon = icons[icon];
  const displayAnime = animeList.slice(0, limit);

  return (
    <section className="py-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${iconColors[icon]} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="flex items-center text-xs text-white/50">
            Lihat Semua
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Grid - 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        {displayAnime.map((anime, index) => (
          <AnimeCardMobile 
            key={anime.id} 
            anime={anime} 
            variant="compact"
            index={index}
          />
        ))}
      </div>
    </section>
  );
});

// Continue watching section with progress - Memoized
const ContinueSection = memo(function ContinueSection({ 
  title, 
  animeList, 
  progressData = [],
  limit = 5 
}: AnimeSectionMobileProps) {
  const displayAnime = animeList.slice(0, limit);

  return (
    <section className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
        </div>
      </div>

      {/* List with progress */}
      <div className="px-4 space-y-2">
        {displayAnime.map((anime, index) => {
          const progress = progressData.find(p => p.animeId === anime.id);
          return (
            <AnimeCardMobile 
              key={anime.id} 
              anime={anime} 
              variant="list"
              index={index}
              progress={progress?.progress}
              episodeTitle={progress?.episodeTitle}
            />
          );
        })}
      </div>
    </section>
  );
});

export default function AnimeSectionMobile(props: AnimeSectionMobileProps) {
  const { variant = 'horizontal' } = props;

  if (variant === 'list') {
    return <ListSection {...props} />;
  }

  if (variant === 'grid') {
    return <GridSection {...props} />;
  }

  if (variant === 'continue') {
    return <ContinueSection {...props} />;
  }

  return <HorizontalSection {...props} />;
}
