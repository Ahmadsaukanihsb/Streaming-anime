import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, Play, Info, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';

export default function RandomAnimeButton() {
    const { animeList } = useApp();
    const navigate = useNavigate();
    const [isSpinning, setIsSpinning] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [randomAnime, setRandomAnime] = useState<typeof animeList[0] | null>(null);

    const getRandomAnime = () => {
        if (animeList.length === 0) return;

        setIsSpinning(true);
        setShowPreview(false);

        // Simulate spinning through anime
        let count = 0;
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * animeList.length);
            setRandomAnime(animeList[randomIndex]);
            count++;

            if (count >= 10) {
                clearInterval(interval);
                setIsSpinning(false);
                setShowPreview(true);
            }
        }, 100);
    };

    const goToAnime = () => {
        if (randomAnime) {
            navigate(`/anime/${randomAnime.id}`);
        }
    };

    const watchNow = () => {
        if (randomAnime) {
            navigate(`/watch/${randomAnime.id}/1`);
        }
    };

    return (
        <div className="relative">
            {/* Main Button */}
            <motion.button
                onClick={getRandomAnime}
                disabled={isSpinning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-4 bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] rounded-2xl text-white font-semibold shadow-lg shadow-[#6C5DD3]/30 hover:shadow-[#6C5DD3]/50 transition-shadow disabled:opacity-70"
            >
                <div className="flex items-center justify-center gap-3">
                    <motion.div
                        animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
                        transition={{ duration: 0.5, repeat: isSpinning ? Infinity : 0, ease: 'linear' }}
                    >
                        <Shuffle className="w-5 h-5" />
                    </motion.div>
                    <span>{isSpinning ? 'Mencari...' : 'Anime Random'}</span>
                    <Sparkles className="w-4 h-4" />
                </div>
            </motion.button>

            {/* Preview Card */}
            <AnimatePresence>
                {showPreview && randomAnime && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 right-0 mb-3 p-4 bg-[#1A1A2E] rounded-2xl border border-white/10 shadow-xl z-50"
                    >
                        <div className="flex gap-3">
                            <div className="relative w-20 h-28 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                    src={randomAnime.poster}
                                    alt={randomAnime.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white line-clamp-2 mb-1">
                                    {randomAnime.title}
                                </h4>
                                <p className="text-xs text-white/50 mb-2">
                                    {randomAnime.status} • {randomAnime.episodes || '?'} EP
                                </p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {randomAnime.genres?.slice(0, 2).map(genre => (
                                        <span key={genre} className="px-2 py-0.5 text-[10px] bg-white/10 text-white/70 rounded-full">
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={watchNow}
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-[#6C5DD3] hover:bg-[#5a4bbf] text-white rounded-lg transition-colors"
                                    >
                                        <Play className="w-3 h-3 fill-current" />
                                        Tonton
                                    </button>
                                    <button
                                        onClick={goToAnime}
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                    >
                                        <Info className="w-3 h-3" />
                                        Detail
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute top-2 right-2 p-1 text-white/30 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
