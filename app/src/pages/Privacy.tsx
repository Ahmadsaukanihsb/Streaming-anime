import { Shield, Eye, Lock, Users, Database, Bell, Mail, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { StaticPageSEO } from '@/components/Seo';

export default function Privacy() {
    const sections = [
        {
            icon: Database,
            title: 'Data yang Kami Kumpulkan',
            content: [
                'Informasi akun (nama, email, password terenkripsi)',
                'Riwayat tontonan dan preferensi',
                'Data penggunaan untuk peningkatan layanan',
                'Informasi perangkat dan browser (untuk kompatibilitas)',
            ],
        },
        {
            icon: Eye,
            title: 'Bagaimana Kami Menggunakan Data',
            content: [
                'Personalisasi rekomendasi anime',
                'Menyimpan progress menonton',
                'Mengirim notifikasi episode baru (jika diizinkan)',
                'Analisis untuk peningkatan platform',
            ],
        },
        {
            icon: Lock,
            title: 'Keamanan Data',
            content: [
                'Password dienkripsi dengan standar industri',
                'Koneksi HTTPS untuk semua transfer data',
                'Akses data terbatas hanya untuk tim yang berwenang',
                'Backup regular untuk mencegah kehilangan data',
            ],
        },
        {
            icon: Users,
            title: 'Berbagi Data',
            content: [
                'Kami TIDAK menjual data pengguna ke pihak ketiga',
                'Data hanya dibagikan jika diwajibkan hukum',
                'Analitik agregat mungkin digunakan untuk pelaporan',
            ],
        },
        {
            icon: Bell,
            title: 'Cookies & Tracking',
            content: [
                'Cookies digunakan untuk menyimpan sesi login',
                'Cookies preferensi untuk pengaturan tema',
                'Tidak ada tracking iklan pihak ketiga',
            ],
        },
        {
            icon: FileText,
            title: 'Hak Pengguna',
            content: [
                'Akses dan unduh data pribadi Anda',
                'Hapus akun dan semua data terkait',
                'Opt-out dari email marketing',
                'Ubah preferensi privasi kapan saja',
            ],
        },
    ];

    return (
        <>
            <StaticPageSEO
                title="Kebijakan Privasi"
                description="Pelajari bagaimana Animeku melindungi data pribadi Anda. Kebijakan privasi lengkap dan transparan."
                canonical="/privacy"
            />
            <div className="min-h-screen bg-[#0F0F1A] pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] mb-6 shadow-xl shadow-[#6C5DD3]/30">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Kebijakan Privasi</h1>
                    <p className="text-white/50 max-w-2xl mx-auto">
                        Kami menghargai privasi Anda. Berikut adalah bagaimana kami menangani data Anda.
                    </p>
                    <p className="text-sm text-white/30 mt-4">
                        Terakhir diperbarui: Januari 2024
                    </p>
                </motion.div>

                {/* Sections */}
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-6 bg-white/5 rounded-2xl border border-white/10"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center">
                                    <section.icon className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-lg font-bold text-white">{section.title}</h2>
                            </div>
                            <ul className="space-y-2 ml-13">
                                {section.content.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-white/70">
                                        <span className="text-[#6C5DD3] mt-1.5">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Contact */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 p-6 bg-gradient-to-r from-[#6C5DD3]/20 to-[#00C2FF]/20 rounded-2xl border border-white/10 text-center"
                >
                    <Mail className="w-8 h-8 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70">
                        Ada pertanyaan tentang privasi?
                    </p>
                    <a
                        href="mailto:privacy@animestream.id"
                        className="text-[#6C5DD3] hover:text-[#00C2FF] transition-colors"
                    >
                        privacy@animestream.id
                    </a>
                </motion.div>
            </div>
            </div>
        </>
    );
}
