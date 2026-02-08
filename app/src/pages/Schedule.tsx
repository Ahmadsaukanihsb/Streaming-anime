import { useState, useMemo, useEffect, memo } from 'react';
import type { Anime } from '@/data/animeData';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Play, Bell, Star } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import { useApp } from '@/context/AppContext';
import { BACKEND_URL } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { StaticPageSEO } from '@/components/Seo';
import { getAnimeUrl } from '@/lib/slug';

// Memoized anime card untuk menghindari re-render
const AnimeCard = memo(({ anime, isSubscribed, isLoading, onToggle }: {
    anime: Anime;
    isSubscribed: boolean;
    isLoading: boolean;
    onToggle: (anime: Anime) => void;
}) => {
    return (
        <div className="flex-shrink-0 w-[140px] sm:w-auto animate-fade-in">
            <Link
                to={getAnimeUrl(anime)}
                className="group block sm:flex gap-0 sm:gap-4 p-0 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(108,93,211,0.1)]"
            >
                {/* Poster */}
                <div className="relative aspect-[3/4] sm:aspect-auto sm:w-20 sm:h-28 w-full rounded-xl overflow-hidden mb-2 sm:mb-0 ring-1 ring-white/10 group-hover:ring-[#6C5DD3]/30 transition-all duration-200">
                    <OptimizedImage
                        src={anime.poster}
                        alt={anime.title}
                        aspectRatio="poster"
                        className="group-hover:scale-105"
                        loading="lazy"
                    />
                    
                    {/* Time Badge - Mobile */}
                    <div className="sm:hidden absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] rounded-lg text-[10px] text-white font-bold shadow-lg z-10">
                        {anime.jadwalRilis?.jam || '??:??'}
                    </div>
                    
                    {/* Episode Badge - Mobile */}
                    <div className="sm:hidden absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[10px] text-white font-bold z-10">
                        EP {anime.episodeData?.length || anime.episodes || '?'}
                    </div>

                    {/* Play Icon - Desktop */}
                    <div className="hidden sm:flex absolute inset-0 items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <div className="w-12 h-12 rounded-full bg-[#6C5DD3] flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-white fill-current ml-1" />
                        </div>
                    </div>
                </div>

                {/* Info - Desktop */}
                <div className="hidden sm:block flex-1 min-w-0 py-0.5 sm:py-1">
                    <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-2 group-hover:text-[#6C5DD3] transition-colors">
                        {anime.title}
                    </h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-xs sm:text-sm text-white/50">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{anime.jadwalRilis?.jam || '??:??'} WIB</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                        <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-white/60">{anime.rating}</span>
                        </div>
                        <span className="text-xs text-white/40">•</span>
                        <span className="text-xs text-[#00C2FF]">
                            {anime.episodeData && anime.episodeData.length > 0
                                ? `${anime.episodeData.length} Ep`
                                : `${anime.episodes} Ep`}
                        </span>
                    </div>
                </div>

                {/* Mobile Info */}
                <div className="sm:hidden">
                    <h3 className="text-xs font-bold text-white line-clamp-2 group-hover:text-[#6C5DD3] transition-colors leading-snug min-h-[2rem]">
                        {anime.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-[11px] text-white/80 font-medium">{anime.rating}</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggle(anime);
                            }}
                            disabled={isLoading}
                            className={`p-1.5 rounded-full transition-all ${isSubscribed ? 'bg-[#6C5DD3]/20 text-[#6C5DD3]' : 'bg-white/5 text-white/40'}`}
                        >
                            {isLoading ? (
                                <div className="w-3 h-3 border-2 border-[#6C5DD3] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Bell className={`w-3 h-3 ${isSubscribed ? 'fill-current' : ''}`} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Notification button - Desktop */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggle(anime);
                    }}
                    disabled={isLoading}
                    className={`hidden sm:block self-center p-2 rounded-xl transition-all ${isSubscribed
                        ? 'bg-[#6C5DD3]/20 text-[#6C5DD3] hover:bg-[#6C5DD3]/30'
                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                        }`}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-[#6C5DD3] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Bell className={`w-5 h-5 ${isSubscribed ? 'fill-current' : ''}`} />
                    )}
                </button>
            </Link>
        </div>
    );
});

// Day names in Indonesian
const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function Schedule() {
    const { animeList, user } = useApp();
    const [selectedDay, setSelectedDay] = useState(new Date().getDay());
    const [subscribedAnime, setSubscribedAnime] = useState<string[]>([]);
    const [loadingSubscription, setLoadingSubscription] = useState<string | null>(null);

    // Fetch user's subscriptions
    useEffect(() => {
        if (!user) {
            setSubscribedAnime([]);
            return;
        }

        const fetchSubscriptions = async () => {
            try {
                const res = await apiFetch(`${BACKEND_URL}/api/schedule-subscriptions/ids?userId=${user.id}`, {
                    headers: { ...getAuthHeaders() }
                });
                const data = await res.json();
                setSubscribedAnime(data.animeIds || []);
            } catch (err) {
                console.error('Failed to fetch subscriptions:', err);
            }
        };

        fetchSubscriptions();
    }, [user]);

    // Toggle subscription
    const handleToggleSubscription = async (anime: Anime) => {
        if (!user) {
            alert('Login untuk mengaktifkan reminder');
            return;
        }

        setLoadingSubscription(anime.id);

        try {
            const res = await apiFetch(`${BACKEND_URL}/api/schedule-subscriptions/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    userId: user.id,
                    animeId: anime.id,
                    animeTitle: anime.title,
                    animePoster: anime.poster,
                    scheduleDay: anime.jadwalRilis?.hari,
                    scheduleTime: anime.jadwalRilis?.jam
                })
            });

            const data = await res.json();

            if (data.subscribed) {
                setSubscribedAnime(prev => [...prev, anime.id]);
                // Subscription toggled successfully
            } else {
                setSubscribedAnime(prev => prev.filter(id => id !== anime.id));
                // Unsubscribed successfully
            }
        } catch (err) {
            console.error('Failed to toggle subscription:', err);
        } finally {
            setLoadingSubscription(null);
        }
    };

    // Get current week dates
    const weekDates = useMemo(() => {
        const today = new Date();
        const currentDay = today.getDay();
        const dates = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - currentDay + i);
            dates.push(date);
        }

        return dates;
    }, []);

    // Map day name to index (0 = Minggu, 1 = Senin, ...)
    const getDayIndex = (dayName: string) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days.indexOf(dayName);
    };

    const scheduleByDay = useMemo(() => {
        const schedule: Record<number, Anime[]> = {
            0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
        };

        // Get all ongoing anime with explicit schedule
        const ongoingAnime = animeList.filter(a => a.status === 'Ongoing');

        ongoingAnime.forEach((anime) => {
            // Only show anime that have jadwalRilis set
            if (anime.jadwalRilis && anime.jadwalRilis.hari) {
                const dayIndex = getDayIndex(anime.jadwalRilis.hari);
                if (dayIndex !== -1) {
                    schedule[dayIndex].push(anime);
                }
            }
            // No fallback - anime without schedule won't appear
        });

        // Sort by release time if available
        Object.keys(schedule).forEach((day) => {
            schedule[Number(day)].sort((a, b) => {
                const timeA = a.jadwalRilis?.jam || '23:59';
                const timeB = b.jadwalRilis?.jam || '23:59';
                return timeA.localeCompare(timeB);
            });
        });

        return schedule;
    }, [animeList]);

    const todayAnime = scheduleByDay[selectedDay] || [];

    return (
        <div className="min-h-screen bg-[#0F0F1A] pb-12">
            <StaticPageSEO
                title="Jadwal Rilis Anime"
                description="Cek jadwal rilis anime terbaru setiap minggu di Animeku. Atur pengingat dan jangan lewatkan episode favoritmu."
                canonical="/schedule"
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
                {/* Header - Desktop Only */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hidden sm:block pb-6 mb-6"
                >
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00C2FF] to-[#6C5DD3] flex items-center justify-center shadow-lg shadow-[#6C5DD3]/20">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Jadwal Rilis</h1>
                    </div>
                </motion.div>

                {/* Week Selector - Modern Pills */}
                <div className="mb-4 sm:mb-8 overflow-x-auto scrollbar-hide">
                    <div className="flex justify-start sm:justify-center gap-1.5 sm:gap-2 px-1">
                        {weekDates.map((date, index) => {
                            const isToday = new Date().toDateString() === date.toDateString();
                            const isSelected = selectedDay === index;
                            const count = scheduleByDay[index]?.length || 0;

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDay(index)}
                                    className={`relative flex-shrink-0 flex flex-col items-center justify-center w-[52px] sm:w-[60px] py-2 sm:py-2.5 rounded-xl sm:rounded-xl transition-all duration-300 ease-out ${isSelected
                                        ? 'text-white'
                                        : isToday
                                            ? 'text-[#6C5DD3]'
                                            : 'text-white/40 hover:text-white/70'
                                        } ${isSelected
                                            ? 'bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] shadow-lg shadow-[#6C5DD3]/25'
                                            : 'bg-white/[0.03] hover:bg-white/[0.06]'
                                        }`}
                                >
                                    {/* Today Indicator (only when not selected) */}
                                    {isToday && !isSelected && (
                                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#6C5DD3] rounded-full" />
                                    )}

                                    {/* Content */}
                                    <span className="relative z-10 text-[9px] sm:text-xs font-medium opacity-80">{dayNamesShort[index]}</span>
                                    <span className="relative z-10 text-sm sm:text-base font-bold leading-tight">{date.getDate()}</span>
                                    
                                    {/* Anime Count Badge */}
                                    {count > 0 && (
                                        <span className={`relative z-10 text-[8px] sm:text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded-full ${isSelected 
                                            ? 'bg-white/20 text-white' 
                                            : 'bg-white/10 text-white/50'
                                        }`}>
                                            {count}
                                        </span>
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                </div>

                {/* Selected Day Header - Compact */}
                <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                        <Calendar className="w-4 h-4 text-[#6C5DD3]" />
                        <h2 className="text-sm sm:text-base font-bold text-white">
                            {dayNames[selectedDay]}, {weekDates[selectedDay]?.getDate()} {weekDates[selectedDay]?.toLocaleDateString('id-ID', { month: 'short' })}
                        </h2>
                    </div>
                </div>

                {/* Anime Schedule - Mobile: Horizontal Scroll, Desktop: Grid */}
                {todayAnime.length > 0 ? (
                    <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible scrollbar-hide pb-2 sm:pb-0">
                        {todayAnime.map((anime) => (
                            <AnimeCard
                                key={anime.id}
                                anime={anime}
                                isSubscribed={subscribedAnime.includes(anime.id)}
                                isLoading={loadingSubscription === anime.id}
                                onToggle={handleToggleSubscription}
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white/70 mb-2">Tidak ada rilis hari ini</h3>
                        <p className="text-white/40">Pilih hari lain untuk melihat jadwal anime</p>
                    </motion.div>
                )}

                {/* Compact Reminder Badge */}
                {user && subscribedAnime.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 mb-4"
                    >
                        <div className="bg-gradient-to-r from-[#6C5DD3]/20 to-[#00C2FF]/10 rounded-2xl p-3 border border-[#6C5DD3]/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center shadow-lg shadow-[#6C5DD3]/30">
                                        <Bell className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-white block">
                                            {subscribedAnime.length} Reminder Aktif
                                        </span>
                                        <span className="text-xs text-white/50">Jangan lewatkan episode baru</span>
                                    </div>
                                </div>
                                <Link to="/profile" className="px-3 py-1.5 bg-[#6C5DD3] hover:bg-[#7C6DE3] text-white text-xs font-medium rounded-lg transition-colors">
                                    Kelola
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Legend */}
                <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
                    <h4 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4">Keterangan</h4>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-white/50">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#6C5DD3]" />
                            <span>Hari ini</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Waktu tayang (WIB)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Klik untuk reminder</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
