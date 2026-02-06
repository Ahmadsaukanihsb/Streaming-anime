import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import type { Anime } from '@/data/animeData';

interface BookmarksTabProps {
  bookmarkedAnime: Anime[];
}

export default function BookmarksTab({ bookmarkedAnime }: BookmarksTabProps) {
  if (bookmarkedAnime.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Bookmark</h3>
        <p className="text-white/50 mb-6">Simpan anime favorit Anda untuk akses cepat</p>
        <Link to="/" className="btn-primary">Jelajahi Anime</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {bookmarkedAnime.map((anime, index) => (
        <motion.div
          key={anime.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link to={`/anime/${anime.id}`} className="group block relative aspect-[3/4] rounded-xl overflow-hidden">
            <img
              src={anime.poster}
              alt={anime.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="font-semibold text-white text-sm line-clamp-2">{anime.title}</h3>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
