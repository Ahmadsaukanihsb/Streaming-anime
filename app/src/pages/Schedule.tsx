import { useState, useMemo, useEffect } from 'react';
import type { Anime } from '@/data/animeData';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Play, Bell, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { BACKEND_URL } from '@/config/api';

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
                const res = await fetch(`${BACKEND_URL}/api/schedule-subscriptions/ids?userId=${user.id}`);
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
            const res = await fetch(`${BACKEND_URL}/api/schedule-subscriptions/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        <div className="min-h-screen bg-[#0F0F1A] pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 sm:mb-12"
                >
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#00C2FF] to-[#6C5DD3] mb-4 sm:mb-6 shadow-xl shadow-[#00C2FF]/30">
                        <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">Jadwal Rilis Anime</h1>
                    <p className="text-white/50 text-sm sm:text-base max-w-2xl mx-auto px-4">
                        Lihat jadwal rilis episode baru anime favoritmu setiap minggu
                    </p>
                </motion.div>

                {/* Week Selector */}
                <div className="flex justify-center mb-6 sm:mb-8 px-2 sm:px-0">
                    <div className="flex w-full sm:w-auto bg-white/5 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 border border-white/10">
                        {weekDates.map((date, index) => {
                            const isToday = new Date().toDateString() === date.toDateString();
                            const isSelected = selectedDay === index;

                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDay(index)}
                                    className={`flex-1 sm:flex-none flex flex-col items-center px-1 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all sm:min-w-[52px] ${isSelected
                                        ? 'bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] text-white shadow-lg'
                                        : isToday
                                            ? 'bg-[#6C5DD3]/20 text-[#6C5DD3]'
                                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <span className="text-[10px] sm:text-xs font-medium">{dayNamesShort[index]}</span>
                                    <span className="text-sm sm:text-base font-bold">{date.getDate()}</span>
                                    {scheduleByDay[index]?.length > 0 && (
                                        <span className={`text-[8px] sm:text-[10px] ${isSelected ? 'text-white/80' : 'text-white/40'}`}>
                                            {scheduleByDay[index].length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Day Header */}
                <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8 px-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#6C5DD3]" />
                    <h2 className="text-base sm:text-xl font-bold text-white text-center">
                        {dayNames[selectedDay]}, {weekDates[selectedDay]?.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </h2>
                </div>

                {/* Anime Schedule */}
                {todayAnime.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {todayAnime.map((anime, index) => {
                            const isSubscribed = subscribedAnime.includes(anime.id);
                            const isLoading = loadingSubscription === anime.id;

                            return (
                                <motion.div
                                    key={anime.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        to={`/anime/${anime.id}`}
                                        className="group flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 hover:border-[#6C5DD3]/50 transition-all"
                                    >
                                        {/* Poster */}
                                        <div className="relative w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden">
                                            <img
                                                src={anime.poster}
                                                alt={anime.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center">
                                                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 py-0.5 sm:py-1">
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

                                        {/* Notification button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleToggleSubscription(anime);
                                            }}
                                            disabled={isLoading}
                                            className={`self-center p-2 rounded-xl transition-all ${isSubscribed
                                                ? 'bg-[#6C5DD3]/30 text-[#6C5DD3]'
                                                : 'bg-white/5 text-white/50 hover:bg-[#6C5DD3]/20 hover:text-[#6C5DD3]'
                                                }`}
                                            title={isSubscribed ? 'Nonaktifkan reminder' : 'Aktifkan reminder'}
                                        >
                                            {isLoading ? (
                                                <div className="w-5 h-5 border-2 border-[#6C5DD3] border-t-transparent rounded-full animate-spin" />
                                            ) : isSubscribed ? (
                                                <Bell className="w-5 h-5 fill-current" />
                                            ) : (
                                                <Bell className="w-5 h-5" />
                                            )}
                                        </button>
                                    </Link>
                                </motion.div>
                            );
                        })}
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

                {/* User Subscriptions Summary */}
                {user && subscribedAnime.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 p-4 bg-[#6C5DD3]/10 rounded-2xl border border-[#6C5DD3]/20"
                    >
                        <div className="flex items-center gap-2 text-[#6C5DD3]">
                            <Bell className="w-5 h-5" />
                            <span className="font-medium">
                                Kamu memiliki {subscribedAnime.length} reminder aktif
                            </span>
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
