import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, Star, TrendingUp, Clock } from 'lucide-react';
import { useRecommendations, useWatchInsights } from '@/hooks/useRecommendations';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';

export default function ForYouSection() {
  const { animeList, watchHistory, ratings, bookmarks, user } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { recommendations, genrePreferences, becauseYouWatched } = useRecommendations(
    animeList,
    watchHistory,
    ratings,
    bookmarks,
    12
  );

  const { greeting, insight } = useWatchInsights(watchHistory, ratings);

  // Don't show if user has no watch history and is not logged in
  if (!user && watchHistory.length === 0) {
    return null;
  }

  // If no recommendations (new user), show genre-based suggestions
  const hasRecommendations = recommendations.length > 0;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-[#6C5DD3]" />
              <h2 className="text-xl font-bold text-white">
                {greeting} Untuk Anda
              </h2>
            </motion.div>
            {insight && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/50 text-sm mt-1 ml-7"
              >
                {insight}
              </motion.p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-white/5 border-white/10 hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-white/5 border-white/10 hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Genre Pills */}
        {genrePreferences.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 mt-3 ml-7"
          >
            <span className="text-white/40 text-xs py-1">Genre favorit:</span>
            {genrePreferences.slice(0, 4).map((pref) => (
              <span
                key={pref.genre}
                className="text-xs px-2 py-1 rounded-full bg-[#6C5DD3]/20 text-[#6C5DD3] border border-[#6C5DD3]/20"
              >
                {pref.genre}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Recommendations Carousel */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {hasRecommendations ? (
            recommendations.map((anime, index) => (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 w-40 sm:w-48"
              >
                <Link to={`/anime/${anime.id}`} className="group block">
                  {/* Poster */}
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                    <img
                      src={anime.poster}
                      alt={anime.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    
                    {/* Match Badge */}
                    {anime.matchPercentage && anime.matchPercentage > 0 && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#6C5DD3] rounded-full text-[10px] font-medium text-white">
                        {anime.matchPercentage}% cocok
                      </div>
                    )}

                    {/* Rating Badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded-full">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-white font-medium">{anime.rating}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        anime.status === 'Ongoing' 
                          ? 'bg-green-500/80 text-white' 
                          : 'bg-blue-500/80 text-white'
                      }`}>
                        {anime.status === 'Ongoing' ? 'On Going' : 'Completed'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-[#6C5DD3] transition-colors">
                      {anime.title}
                    </h3>
                    <p className="text-white/40 text-xs mt-0.5 line-clamp-1">
                      {anime.reason}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/30 text-xs">{anime.releasedYear}</span>
                      <span className="text-white/30 text-xs">•</span>
                      <span className="text-white/30 text-xs">{anime.episodes} eps</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            // Fallback for new users
            animeList
              .sort((a, b) => (b.views || 0) - (a.views || 0))
              .slice(0, 8)
              .map((anime, index) => (
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0 w-40 sm:w-48"
                >
                  <Link to={`/anime/${anime.id}`} className="group block">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                      <img
                        src={anime.poster}
                        alt={anime.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded-full">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                        <span className="text-[10px] text-white font-medium">{anime.rating}</span>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white">
                          Populer
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm line-clamp-2 group-hover:text-[#6C5DD3] transition-colors">
                        {anime.title}
                      </h3>
                      <p className="text-white/40 text-xs mt-0.5">Cocok untuk pemula</p>
                    </div>
                  </Link>
                </motion.div>
              ))
          )}
        </div>
      </div>

      {/* Because You Watched Section */}
      {becauseYouWatched.length > 0 && (
        <div className="mt-10 space-y-6">
          {becauseYouWatched.slice(0, 2).map(({ anime, recommendations }) => (
            <div key={anime.id}>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#6C5DD3]" />
                Karena Anda menonton <span className="text-[#6C5DD3]">{anime.title}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {recommendations.slice(0, 4).map((rec) => (
                  <Link
                    key={rec.id}
                    to={`/anime/${rec.id}`}
                    className="group"
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                      <img
                        src={rec.poster}
                        alt={rec.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-[#6C5DD3] rounded text-[10px] text-white">
                        {rec.matchPercentage}%
                      </div>
                    </div>
                    <h4 className="text-white text-sm font-medium line-clamp-1 group-hover:text-[#6C5DD3] transition-colors">
                      {rec.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
