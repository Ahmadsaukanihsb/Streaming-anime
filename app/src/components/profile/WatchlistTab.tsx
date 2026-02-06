import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Play, Trash2 } from 'lucide-react';
import type { Anime } from '@/data/animeData';

interface WatchlistTabProps {
  watchlist: string[];
  animeList: Anime[];
  onRemove: (animeId: string) => void;
}

export default function WatchlistTab({ watchlist, animeList, onRemove }: WatchlistTabProps) {
  const watchlistAnime = watchlist
    .map((id: string) => animeList.find(a => a.id === id))
    .filter((a): a is Anime => a !== undefined);

  if (watchlistAnime.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Daftar Tonton Kosong</h3>
        <p className="text-white/50 mb-6">Tambahkan anime yang ingin Anda tonton nanti</p>
        <Link to="/" className="btn-primary">Jelajahi Anime</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {watchlistAnime.map((anime, index) => (
        <motion.div
          key={anime.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="group relative aspect-[3/4] rounded-xl overflow-hidden"
        >
          <Link to={`/anime/${anime.id}`} className="block w-full h-full">
            <img
              src={anime.poster}
              alt={anime.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-semibold text-white line-clamp-2 text-sm">{anime.title}</h3>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
              <div className="w-12 h-12 rounded-full bg-[#6C5DD3] flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              </div>
            </div>
          </Link>
          <button
            onClick={() => onRemove(anime.id)}
            className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
