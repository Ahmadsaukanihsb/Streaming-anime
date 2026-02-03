import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function ScheduleWidget() {
    const { animeList } = useApp();
    const today = new Date().getDay();
    const [selectedDay, setSelectedDay] = useState(today);

    // Map day name to index (0 = Minggu, 1 = Senin, ...)
    const getDayIndex = (dayName: string) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days.indexOf(dayName);
    };

    // Get ongoing anime, filter for selected day (with fallback)
    const ongoingAnime = animeList.filter(a => a.status === 'Ongoing');

    const scheduleForDay = ongoingAnime.filter((anime, index) => {
        if (anime.jadwalRilis && anime.jadwalRilis.hari) {
            // Use real schedule if available
            const dayIndex = getDayIndex(anime.jadwalRilis.hari);
            return dayIndex === selectedDay;
        } else {
            // Fallback: distribute based on index
            return index % 7 === selectedDay;
        }
    }).slice(0, 4); // Max 4 per day

    const navigateDay = (direction: 'prev' | 'next') => {
        setSelectedDay(prev => {
            if (direction === 'prev') return (prev - 1 + 7) % 7;
            return (prev + 1) % 7;
        });
    };

    return (
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Jadwal Rilis</h3>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => navigateDay('prev')}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-white/60" />
                    </button>
                    <button
                        onClick={() => navigateDay('next')}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-white/60" />
                    </button>
                </div>
            </div>

            {/* Day Tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide">
                {DAYS_SHORT.map((day, index) => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(index)}
                        className={`flex-1 min-w-[40px] py-2 text-xs font-medium rounded-lg transition-all ${index === selectedDay
                            ? 'bg-[#6C5DD3] text-white'
                            : index === today
                                ? 'bg-[#6C5DD3]/20 text-[#6C5DD3]'
                                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Selected Day Label */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-white">{DAYS[selectedDay]}</span>
                {selectedDay === today && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500/20 text-green-400 rounded-full">
                        HARI INI
                    </span>
                )}
            </div>

            {/* Anime List */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedDay}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                >
                    {scheduleForDay.length > 0 ? (
                        scheduleForDay.map((anime) => (
                            <Link
                                key={anime.id}
                                to={`/anime/${anime.id}`}
                                className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
                            >
                                <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                        src={anime.poster}
                                        alt={anime.title}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Play className="w-4 h-4 text-white fill-current" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-white line-clamp-1 group-hover:text-[#6C5DD3] transition-colors">
                                        {anime.title}
                                    </h4>
                                    <p className="text-xs text-white/40">
                                        EP {anime.episodeData?.length || anime.episodes || '?'} • {anime.duration || '24 min'}
                                    </p>
                                </div>
                                <span className="text-xs text-white/30">
                                    {anime.jadwalRilis?.jam || '??:??'}
                                </span>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-6">
                            <Calendar className="w-10 h-10 text-white/10 mx-auto mb-2" />
                            <p className="text-sm text-white/40">Tidak ada rilis hari ini</p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
