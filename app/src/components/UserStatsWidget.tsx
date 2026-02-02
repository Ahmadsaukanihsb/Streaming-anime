import { Link } from 'react-router-dom';
import { Play, Clock, Bookmark, Star, TrendingUp, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

export default function UserStatsWidget() {
    const { user, watchHistory, bookmarks, ratings } = useApp();

    // Don't show if not logged in
    if (!user) {
        return (
            <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-center py-4">
                    <Trophy className="w-10 h-10 text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-white/50 mb-3">Login untuk melihat statistik</p>
                    <Link
                        to="/login"
                        className="inline-block px-4 py-2 text-sm bg-[#6C5DD3] hover:bg-[#5a4bbf] text-white rounded-lg transition-colors"
                    >
                        Masuk
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate stats
    const uniqueAnimeWatched = new Set(watchHistory.map(h => h.animeId)).size;
    const totalEpisodesWatched = watchHistory.length;
    const totalHoursWatched = Math.round((totalEpisodesWatched * 24) / 60); // Assume 24 min per episode
    const averageRating = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
        : '0.0';

    const stats = [
        {
            icon: Play,
            label: 'Anime Ditonton',
            value: uniqueAnimeWatched,
            color: 'from-purple-500 to-indigo-500',
        },
        {
            icon: Clock,
            label: 'Jam Menonton',
            value: `${totalHoursWatched}h`,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Bookmark,
            label: 'Bookmark',
            value: bookmarks.length,
            color: 'from-pink-500 to-rose-500',
        },
        {
            icon: Star,
            label: 'Rating Rata-rata',
            value: averageRating,
            color: 'from-yellow-500 to-orange-500',
        },
    ];

    return (
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Statistik Kamu</h3>
                    <p className="text-xs text-white/50">Halo, {user.name}!</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-white/5 rounded-xl"
                    >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                            <stat.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-white/50">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* View Profile Link */}
            <Link
                to="/profile"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
                <Trophy className="w-4 h-4" />
                Lihat Profil Lengkap
            </Link>
        </div>
    );
}
