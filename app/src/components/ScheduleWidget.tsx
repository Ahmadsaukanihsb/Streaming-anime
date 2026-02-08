import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Play, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getAnimeUrl } from '@/lib/slug';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function ScheduleWidget() {
    const { animeList } = useApp();
    const today = new Date().getDay();
    const [selectedDay, setSelectedDay] = useState(today);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Map day name to index (0 = Minggu, 1 = Senin, ...)
    const getDayIndex = (dayName: string) => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days.indexOf(dayName);
    };

    // Get ongoing anime, filter for selected day (with fallback)
    const ongoingAnime = animeList.filter(a => a.status === 'Ongoing');

    const scheduleForDay = ongoingAnime.filter((anime, index) => {
        if (anime.jadwalRilis && anime.jadwalRilis.hari) {
            const dayIndex = getDayIndex(anime.jadwalRilis.hari);
            return dayIndex === selectedDay;
        } else {
            return index % 7 === selectedDay;
        }
    });

    const navigateDay = (direction: 'prev' | 'next') => {
        setSelectedDay(prev => {
            if (direction === 'prev') return (prev - 1 + 7) % 7;
            return (prev + 1) % 7;
        });
    };

    // Swipe handling
    const handleSwipe = (direction: 'left' | 'right') => {
        if (direction === 'left') navigateDay('next');
        else navigateDay('prev');
    };

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            handleSwipe(diff > 0 ? 'left' : 'right');
        }
    };

    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Header - Mobile Optimized */}
            <div className="p-4 sm:p-5 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Jadwal Rilis</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => navigateDay('prev')}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5 text-white/60" />
                        </button>
                        <button
                            onClick={() => navigateDay('next')}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5 text-white/60" />
                        </button>
                    </div>
                </div>

                {/* Day Tabs - Horizontal Scroll dengan Snap */}
                <div 
                    ref={scrollRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
                >
                    {DAYS_SHORT.map((day, index) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(index)}
                            className={`flex-shrink-0 snap-center min-w-[60px] sm:min-w-[40px] py-2.5 sm:py-2 px-3 sm:px-2 text-sm sm:text-xs font-medium rounded-xl transition-all ${index === selectedDay
                                ? 'bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/30'
                                : index === today
                                    ? 'bg-[#6C5DD3]/20 text-[#6C5DD3] border border-[#6C5DD3]/30'
                                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="sm:hidden">{DAYS[index]}</span>
                            <span className="hidden sm:block">{day}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area dengan Swipe Support */}
            <div 
                className="p-4 sm:p-5"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Selected Day Label */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-base sm:text-sm font-semibold text-white">{DAYS[selectedDay]}</span>
                        {selectedDay === today && (
                            <span className="px-2.5 py-1 text-xs font-bold bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                                HARI INI
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-white/40">
                        {scheduleForDay.length} anime
                    </span>
                </div>

                {/* Anime List - Mobile: Horizontal Scroll Cards */}
                <div key={selectedDay} className="animate-fade-in">
                        {scheduleForDay.length > 0 ? (
                            <>
                                {/* Mobile: Horizontal Scroll Cards */}
                                <div className="sm:hidden flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
                                    {scheduleForDay.map((anime) => (
                                        <Link
                                            key={anime.id}
                                            to={getAnimeUrl(anime)}
                                            className="group flex-shrink-0 w-[140px]"
                                        >
                                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                                                <img
                                                    src={anime.poster}
                                                    alt={anime.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                    loading="lazy"
                                                />
                                                {/* Play Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#6C5DD3] flex items-center justify-center">
                                                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                                                    </div>
                                                </div>
                                                {/* Episode Badge */}
                                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-[10px] font-medium text-white">
                                                    EP {anime.episodeData?.length || anime.episodes || '?'}
                                                </div>
                                            </div>
                                            <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-[#6C5DD3] transition-colors min-h-[2.5rem]">
                                                {anime.title}
                                            </h4>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3 text-white/40" />
                                                <span className="text-xs text-white/40">
                                                    {anime.jadwalRilis?.jam || '??:??'}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Desktop: List Layout */}
                                <div className="hidden sm:block space-y-2">
                                    {scheduleForDay.slice(0, 4).map((anime) => (
                                        <Link
                                            key={anime.id}
                                            to={getAnimeUrl(anime)}
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
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                                    <Calendar className="w-8 h-8 text-white/20" />
                                </div>
                                <p className="text-sm text-white/40">Tidak ada rilis hari ini</p>
                            </div>
                        )}
                </div>

                {/* Swipe Hint - Mobile Only */}
                <div className="sm:hidden flex items-center justify-center gap-2 mt-4 text-white/30 text-xs">
                    <ChevronLeft className="w-4 h-4" />
                    <span>Swipe untuk ganti hari</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
}
