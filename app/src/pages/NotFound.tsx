import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { StaticPageSEO } from '@/components/Seo';

export default function NotFound() {
    return (
        <>
            <StaticPageSEO
                title="Halaman Tidak Ditemukan - 404"
                description="Maaf, halaman yang Anda cari tidak ditemukan. Kembali ke beranda atau jelajahi anime lainnya."
                canonical="/404"
            />
            <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6C5DD3]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#00C2FF]/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative text-center max-w-lg"
            >
                {/* 404 Number */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mb-8"
                >
                    <h1 className="text-[150px] md:text-[200px] font-black leading-none bg-gradient-to-br from-[#6C5DD3] via-[#00C2FF] to-[#FF6B6B] bg-clip-text text-transparent">
                        404
                    </h1>
                </motion.div>

                {/* Icon */}
                <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center mb-6 shadow-xl shadow-[#6C5DD3]/30"
                >
                    <Film className="w-10 h-10 text-white" />
                </motion.div>

                {/* Text */}
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Halaman Tidak Ditemukan
                </h2>
                <p className="text-white/50 mb-8 max-w-md mx-auto">
                    Maaf, halaman yang kamu cari tidak ada atau mungkin sudah dipindahkan.
                    Mungkin anime ini masih dalam perjalanan dari dunia lain? 🚀
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => window.history.back()}
                        variant="outline"
                        className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </Button>
                    <Link to="/">
                        <Button className="gap-2 bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] hover:opacity-90 w-full">
                            <Home className="w-4 h-4" />
                            Ke Beranda
                        </Button>
                    </Link>
                    <Link to="/search">
                        <Button variant="outline" className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10 w-full">
                            <Search className="w-4 h-4" />
                            Cari Anime
                        </Button>
                    </Link>
                </div>

                {/* Fun suggestions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10"
                >
                    <p className="text-white/70 text-sm mb-4">Mungkin kamu tertarik dengan:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {['Action', 'Romance', 'Comedy', 'Fantasy', 'Isekai'].map((genre) => (
                            <Link
                                key={genre}
                                to={`/genres?genre=${genre}`}
                                className="px-4 py-2 bg-white/5 hover:bg-[#6C5DD3]/20 rounded-full text-white/60 hover:text-white text-sm transition-colors"
                            >
                                {genre}
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
        </>
    );
}
