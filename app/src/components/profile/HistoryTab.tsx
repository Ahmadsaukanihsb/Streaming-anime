import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import type { WatchHistory } from '@/context/AppContext';
import type { Anime } from '@/data/animeData';

interface HistoryTabProps {
  watchHistory: WatchHistory[];
  animeList: Anime[];
}

export default function HistoryTab({ watchHistory, animeList }: HistoryTabProps) {
  const recentlyWatched = watchHistory
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)
    .map(h => {
      const anime = animeList.find(a => a.id === h.animeId);
      return { ...h, anime };
    })
    .filter(h => h.anime);

  if (recentlyWatched.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Riwayat</h3>
        <p className="text-white/50 mb-6">Mulai menonton anime untuk melihat riwayat di sini</p>
        <Link to="/" className="btn-primary">Jelajahi Anime</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentlyWatched.map((item, index) => (
        <motion.div
          key={`${item.animeId}-${item.episodeNumber}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex flex-col xs:flex-row items-start xs:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <img
            src={item.anime?.poster}
            alt={item.anime?.title}
            className="w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-lg flex-shrink-0"
            loading="lazy"
          />
          <div className="flex-1 min-w-0 w-full xs:w-auto">
            <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-1">{item.anime?.title}</h3>
            <p className="text-white/50 text-xs sm:text-sm">Episode {item.episodeNumber}</p>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                <span>Progress</span>
                <span>{Math.round(item.progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6C5DD3] rounded-full"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          </div>
          <Link
            to={`/watch/${item.animeId}/${item.episodeNumber}`}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#6C5DD3] text-white text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-[#5a4ec0] transition-colors w-full xs:w-auto text-center"
          >
            Lanjutkan
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
