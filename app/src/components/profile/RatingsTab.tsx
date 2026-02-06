import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Trash2 } from 'lucide-react';
import type { Rating } from '@/context/AppContext';
import type { Anime } from '@/data/animeData';

interface RatingsTabProps {
  ratings: Rating[];
  animeList: Anime[];
  onDeleteRating: (animeId: string) => void;
}

export default function RatingsTab({ ratings, animeList, onDeleteRating }: RatingsTabProps) {
  const ratedAnime = ratings
    .map(r => {
      const anime = animeList.find(a => a.id === r.animeId);
      return { ...r, anime };
    })
    .filter(r => r.anime)
    .sort((a, b) => b.rating - a.rating);

  if (ratedAnime.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Rating</h3>
        <p className="text-white/50 mb-6">Rating anime yang sudah Anda tonton untuk rekomendasi lebih baik</p>
        <Link to="/" className="btn-primary">Jelajahi Anime</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ratedAnime.map((item, index) => (
        <motion.div
          key={item.animeId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <img
            src={item.anime?.poster}
            alt={item.anime?.title}
            className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <Link to={`/anime/${item.animeId}`} className="hover:text-[#6C5DD3] transition-colors">
              <h3 className="font-semibold text-white line-clamp-1">{item.anime?.title}</h3>
            </Link>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-full">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-semibold">{item.rating}</span>
                <span className="text-yellow-400/70 text-sm">/10</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onDeleteRating(item.animeId)}
            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Hapus rating"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
