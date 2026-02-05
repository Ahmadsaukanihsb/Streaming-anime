import { FileText, CheckCircle, XCircle, AlertCircle, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Terms() {
    const sections = [
        {
            title: 'Ketentuan Umum',
            content: `Dengan menggunakan layanan kami, Anda menyetujui syarat dan ketentuan berikut. 
      Layanan kami ditujukan untuk hiburan dan tujuan non-komersial. Anda harus berusia minimal 
      13 tahun untuk menggunakan layanan ini, atau dengan pengawasan orang tua jika di bawah umur tersebut.`,
        },
        {
            title: 'Akun Pengguna',
            content: `Anda bertanggung jawab untuk menjaga kerahasiaan akun dan password Anda. 
      Setiap aktivitas yang terjadi di bawah akun Anda adalah tanggung jawab Anda. 
      Kami berhak menonaktifkan akun yang melanggar ketentuan layanan.`,
        },
        {
            title: 'Konten',
            content: `Semua konten anime yang tersedia di platform kami adalah untuk streaming saja. 
      Anda tidak diperbolehkan mengunduh, mendistribusikan, atau menggunakan konten untuk tujuan komersial. 
      Hak cipta konten dimiliki oleh pemegang lisensi masing-masing.`,
        },
        {
            title: 'Perilaku Pengguna',
            content: `Dilarang melakukan aktivitas yang dapat mengganggu layanan, termasuk hacking, 
      spamming, atau penyalahgunaan sistem. Pengguna yang melanggar dapat dikenakan pembatasan 
      atau pemblokiran akun secara permanen.`,
        },
    ];

    const allowed = [
        'Menonton anime untuk keperluan pribadi',
        'Membuat akun dan menyimpan watchlist',
        'Berbagi link anime ke teman',
        'Memberikan rating dan review',
        'Berpartisipasi dalam komunitas',
    ];

    const prohibited = [
        'Download atau rip konten video',
        'Menggunakan bot atau scraper',
        'Berbagi akun secara massal',
        'Mengunggah konten ilegal',
        'Melecehkan pengguna lain',
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
                        <Scale className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Syarat dan Ketentuan</h1>
                    <p className="text-white/50 max-w-2xl mx-auto">
                        Mohon baca dengan seksama sebelum menggunakan layanan kami
                    </p>
                    <p className="text-sm text-white/30 mt-4">
                        Terakhir diperbarui: Januari 2024
                    </p>
                </motion.div>

                {/* Sections */}
                <div className="space-y-6 mb-12">
                    {sections.map((section, index) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-6 bg-white/5 rounded-2xl border border-white/10"
                        >
                            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#6C5DD3]" />
                                {section.title}
                            </h2>
                            <p className="text-white/70 leading-relaxed">{section.content}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Allowed vs Prohibited */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-6 bg-green-500/10 rounded-2xl border border-green-500/20"
                    >
                        <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Diperbolehkan
                        </h3>
                        <ul className="space-y-2">
                            {allowed.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-white/70">
                                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-6 bg-red-500/10 rounded-2xl border border-red-500/20"
                    >
                        <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            Dilarang
                        </h3>
                        <ul className="space-y-2">
                            {prohibited.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-white/70">
                                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="p-6 bg-white/5 rounded-2xl border border-white/10"
                >
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-semibold text-white mb-2">Perubahan Ketentuan</h4>
                            <p className="text-sm text-white/50">
                                Kami berhak mengubah syarat dan ketentuan ini kapan saja. Perubahan akan
                                diumumkan melalui platform dan email. Dengan terus menggunakan layanan setelah
                                perubahan, Anda menyetujui ketentuan yang diperbarui.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Links */}
                <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
                    <Link to="/privacy" className="text-[#6C5DD3] hover:text-[#00C2FF] transition-colors">
                        Kebijakan Privasi
                    </Link>
                    <span className="text-white/20">•</span>
                    <Link to="/contact" className="text-[#6C5DD3] hover:text-[#00C2FF] transition-colors">
                        Hubungi Kami
                    </Link>
                    <span className="text-white/20">•</span>
                    <Link to="/faq" className="text-[#6C5DD3] hover:text-[#00C2FF] transition-colors">
                        FAQ
                    </Link>
                </div>
            </div>
        </div>
    );
}
