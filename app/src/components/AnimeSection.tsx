import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame, Clock, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Anime, Episode } from '@/data/animeData';
import AnimeCard from './AnimeCard';

interface AnimeSectionProps {
  title: string;
  subtitle?: string;
  animeList: Anime[];
  episodes?: Episode[];
  variant?: 'grid' | 'slider' | 'episode' | 'top-rated' | 'sidebar-list';
  icon?: 'flame' | 'clock' | 'star' | 'trending';
  viewAllLink?: string;
  limit?: number;
}

const icons = {
  flame: Flame,
  clock: Clock,
  star: Star,
  trending: TrendingUp,
};

// Gradient colors for each icon type
const iconGradients = {
  flame: 'from-[#FF6B6B] to-[#FF8E53]',      // Orange-red gradient
  clock: 'from-[#00C2FF] to-[#6C5DD3]',      // Cyan to purple
  star: 'from-[#FFD93D] to-[#FF8E53]',       // Yellow to orange
  trending: 'from-[#FF6B6B] to-[#C73659]',   // Pink-red gradient
};

export default function AnimeSection({
  title,
  subtitle,
  animeList,
  episodes,
  variant = 'grid',
  icon = 'flame',
  viewAllLink,
  limit = 8,
}: AnimeSectionProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const Icon = icons[icon];
  const iconGradient = iconGradients[icon];

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const displayAnime = animeList.slice(0, limit);

  if (variant === 'slider') {
    return (
      <section className="py-4 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-md sm:shadow-lg`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold font-heading text-white">{title}</h2>
                {subtitle && <p className="text-xs sm:text-sm text-white/50 hidden sm:block">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => scroll('left')}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
              </button>
              {viewAllLink && (
                <Link
                  to={viewAllLink}
                  className="ml-2 sm:ml-4 text-xs sm:text-sm text-[#6C5DD3] hover:text-[#00C2FF] transition-colors"
                >
                  Lihat Semua
                </Link>
              )}
            </div>
          </div>

          {/* Slider */}
          <div
            ref={sliderRef}
            className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 sm:pb-4 -mx-3 px-3 sm:-mx-4 sm:px-4"
          >
            {displayAnime.map((anime, index) => (
              <div key={anime.id} className="flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]">
                <AnimeCard anime={anime} index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'episode') {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGradients.clock} flex items-center justify-center shadow-md sm:shadow-lg`}>
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-heading text-white">{title}</h2>
                {subtitle && <p className="text-sm text-white/50">{subtitle}</p>}
              </div>
            </div>
            {viewAllLink && (
              <Link
                to={viewAllLink}
                className="text-sm text-[#6C5DD3] hover:text-[#00C2FF] transition-colors"
              >
                Lihat Semua
              </Link>
            )}
          </div>

          {/* Episode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {episodes?.slice(0, limit).map((episode, index) => (
              <motion.div
                key={episode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/watch/${episode.animeId}/${episode.number}`}
                  className="group block relative aspect-video rounded-xl overflow-hidden"
                >
                  <img
                    src={episode.thumbnail}
                    alt={episode.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Episode Number */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#6C5DD3] text-white text-xs font-bold rounded-lg">
                    EP {episode.number}
                  </div>

                  {/* Duration */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
                    {episode.duration}
                  </div>

                  {/* Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-[#6C5DD3]/90 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white fill-current ml-1" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-medium text-white text-sm line-clamp-1 group-hover:text-[#6C5DD3] transition-colors">
                      {episode.title}
                    </h3>
                    <p className="text-xs text-white/50 mt-1">{episode.releasedDate}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'sidebar-list') {
    return (
      <section className="py-8 bg-white/5 rounded-2xl p-6 border border-white/10 h-fit">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-md sm:shadow-lg`}>
            <Icon className="w-4 h-4 text-white fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">{title}</h2>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col gap-4">
          {displayAnime.slice(0, 5).map((anime, index) => (
            <Link key={anime.id} to={`/anime/${anime.id}`} className="group flex gap-3">
              <div className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                <img
                  src={anime.poster}
                  alt={anime.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute top-1 left-1 w-5 h-5 bg-black/60 backdrop-blur-[2px] sm:backdrop-blur-sm rounded-md flex items-center justify-center">
                  <span className="text-xs font-bold text-white">#{index + 1}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-[#6C5DD3] transition-colors">{anime.title}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-white/70">{anime.rating}</span>
                </div>
                <div className="text-xs text-white/50 mt-1 line-clamp-1">
                  {anime.genres.slice(0, 2).join(', ')}
                </div>
              </div>
            </Link>
          ))}

          {viewAllLink && (
            <Link to={viewAllLink} className="mt-2 text-center py-2 text-sm text-white/50 hover:text-white transition-colors border border-white/10 rounded-xl hover:bg-white/5">
              Lihat Semua
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (variant === 'top-rated') {
    return (
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGradients.star} flex items-center justify-center shadow-md sm:shadow-lg`}>
                <Star className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-heading text-white">{title}</h2>
                {subtitle && <p className="text-sm text-white/50">{subtitle}</p>}
              </div>
            </div>
            {viewAllLink && (
              <Link
                to={viewAllLink}
                className="text-sm text-[#6C5DD3] hover:text-[#00C2FF] transition-colors"
              >
                Lihat Semua
              </Link>
            )}
          </div>

          {/* Top Rated Grid - Featured First */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured Card */}
            {displayAnime[0] && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:row-span-2"
              >
                <Link
                  to={`/anime/${displayAnime[0].id}`}
                  className="group block relative h-full min-h-[400px] rounded-2xl overflow-hidden"
                >
                  <img
                    src={displayAnime[0].poster}
                    alt={displayAnime[0].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  {/* Rank Badge */}
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">#1</span>
                  </div>

                  {/* Rating */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-black/60 backdrop-blur-[2px] sm:backdrop-blur-sm rounded-lg">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-bold text-white">{displayAnime[0].rating}</span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#6C5DD3] transition-colors">
                      {displayAnime[0].title}
                    </h3>
                    <p className="text-white/60 line-clamp-2 mb-4">{displayAnime[0].synopsis}</p>
                    <div className="flex items-center gap-3">
                      {displayAnime[0].genres.slice(0, 3).map((genre) => (
                        <span key={genre} className="px-3 py-1 text-sm bg-white/10 text-white/70 rounded-full">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Other Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayAnime.slice(1, 5).map((anime, index) => (
                <AnimeCard key={anime.id} anime={anime} variant="horizontal" index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default Grid
  return (
    <section className="py-4 sm:py-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-md sm:shadow-lg`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold font-heading text-white">{title}</h2>
              {subtitle && <p className="text-xs sm:text-sm text-white/50 hidden sm:block">{subtitle}</p>}
            </div>
          </div>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs sm:text-sm text-[#6C5DD3] hover:text-[#00C2FF] transition-colors"
            >
              Lihat Semua
            </Link>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-1.5 sm:gap-3 lg:gap-5">
          {displayAnime.map((anime, index) => (
            <AnimeCard key={anime.id} anime={anime} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
