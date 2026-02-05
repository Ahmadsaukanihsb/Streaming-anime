import { Link } from 'react-router-dom';
import { Info, Heart, Users, Film, Shield, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
    const features = [
        { icon: Film, title: 'Koleksi Lengkap', description: 'Ribuan anime dari berbagai genre dan era' },
        { icon: Globe, title: 'Subtitle Indonesia', description: 'Terjemahan berkualitas oleh tim berpengalaman' },
        { icon: Shield, title: 'Aman & Terpercaya', description: 'Platform bebas iklan berbahaya dan malware' },
        { icon: Sparkles, title: 'Kualitas HD', description: 'Streaming dengan kualitas terbaik hingga 1080p' },
    ];

    const team = [
        { name: 'Admin', role: 'Founder & Developer' },
        { name: 'Translator Team', role: 'Subtitle & Localization' },
        { name: 'Community', role: 'Content Curators' },
    ];

    return (
        <div className="min-h-screen bg-[#0F0F1A] pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] mb-6 shadow-xl shadow-[#6C5DD3]/30">
                        <Info className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Tentang Kami</h1>
                    <p className="text-white/50 max-w-2xl mx-auto">
                        Website ini adalah platform streaming anime terbaik untuk penggemar anime Indonesia
                    </p>
                </motion.div>

                {/* Story */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-12 p-8 bg-white/5 rounded-3xl border border-white/10"
                >
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        Cerita Kami
                    </h2>
                    <div className="space-y-4 text-white/70 leading-relaxed">
                        <p>
                            Kami didirikan oleh para penggemar anime yang ingin memberikan pengalaman menonton
                            terbaik untuk komunitas wibu Indonesia. Kami memahami betapa frustrasinya mencari situs
                            streaming yang aman, cepat, dan berkualitas.
                        </p>
                        <p>
                            Misi kami sederhana: menyediakan platform streaming anime yang mudah digunakan,
                            dengan koleksi lengkap, subtitle berkualitas, dan tanpa iklan yang mengganggu.
                        </p>
                        <p>
                            Terima kasih telah menjadi bagian dari keluarga kami! 🎉
                        </p>
                    </div>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                >
                    <h2 className="text-xl font-bold text-white mb-6 text-center">Mengapa Pilih Kami?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {features.map((feature, _index) => (
                            <div
                                key={feature.title}
                                className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-[#6C5DD3]/50 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                                <p className="text-sm text-white/50">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Team */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-12"
                >
                    <h2 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                        <Users className="w-5 h-5 text-[#6C5DD3]" />
                        Tim Kami
                    </h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {team.map((member) => (
                            <div
                                key={member.name}
                                className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 text-center"
                            >
                                <h3 className="font-semibold text-white">{member.name}</h3>
                                <p className="text-sm text-white/50">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center p-8 bg-gradient-to-r from-[#6C5DD3]/20 to-[#00C2FF]/20 rounded-3xl border border-white/10"
                >
                    <h3 className="text-xl font-bold text-white mb-2">Ada Pertanyaan?</h3>
                    <p className="text-white/50 mb-6">Hubungi kami kapan saja!</p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        Hubungi Kami
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
