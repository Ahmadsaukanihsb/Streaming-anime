import { Link } from 'react-router-dom';
import { Play, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

export default function ContinueWatching() {
    const { watchHistory, animeList, user } = useApp();

    // Don't show if not logged in or no watch history
    if (!user || watchHistory.length === 0) return null;

    // Get unique anime from watch history with progress < 100%
    const continueWatchingList = watchHistory
        .filter(h => h.progress < 95) // Only show anime not fully watched
        .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
        .reduce((acc, h) => {
            // Keep only one entry per anime (most recent episode)
            if (!acc.find(item => item.animeId === h.animeId)) {
                const anime = animeList.find(a => a.id === h.animeId);
                if (anime) {
                    acc.push({ ...h, anime });
                }
            }
            return acc;
        }, [] as Array<typeof watchHistory[0] & { anime: typeof animeList[0] }>)
        .slice(0, 10); // Limit to 10

    if (continueWatchingList.length === 0) return null;

    return (
        <section className="mb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center shadow-md sm:shadow-lg shadow-[#6C5DD3]/20 sm:shadow-[#6C5DD3]/30">
                        <Play className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl lg:text-2xl font-bold font-heading text-white">Lanjutkan Menonton</h2>
                        <p className="text-sm text-white/50">Tonton dari terakhir kali</p>
                    </div>
                </div>
                {continueWatchingList.length > 5 && (
                    <Link
                        to="/profile?tab=history"
                        className="flex items-center gap-1 text-sm text-[#6C5DD3] hover:text-white transition-colors"
                    >
                        Lihat Semua
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                )}
            </div>

            {/* Horizontal Scroll Cards */}
            <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                    {continueWatchingList.map((item, index) => (
                        <motion.div
                            key={`${item.animeId}-${item.episodeNumber}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex-shrink-0 w-72 snap-start"
                        >
                            <Link
                                to={`/watch/${item.animeId}/${item.episodeNumber}`}
                                className="group block bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-[#6C5DD3]/30"
                            >
                                {/* Thumbnail with Play Overlay */}
                                <div className="relative aspect-video overflow-hidden">
                                    <img
                                        src={item.anime.poster}
                                        alt={item.anime.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                    {/* Play Button */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-14 h-14 rounded-full bg-[#6C5DD3] flex items-center justify-center shadow-md sm:shadow-lg shadow-[#6C5DD3]/20 sm:shadow-[#6C5DD3]/30">
                                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                                        </div>
                                    </div>

                                    {/* Episode Badge */}
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-[2px] sm:backdrop-blur-sm rounded-lg text-xs font-medium text-white">
                                        EP {item.episodeNumber}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                        <div
                                            className="h-full bg-[#6C5DD3] rounded-r-full"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-medium text-white line-clamp-1 group-hover:text-[#6C5DD3] transition-colors">
                                        {item.anime.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                                        <Clock className="w-3 h-3" />
                                        <span>{Math.round(item.progress)}% selesai</span>
                                        <span>•</span>
                                        <span>{formatTimeAgo(item.timestamp)}</span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Helper function to format timestamp
function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Baru saja';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
    return `${Math.floor(seconds / 604800)} minggu lalu`;
}
