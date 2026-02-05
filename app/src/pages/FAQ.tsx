import { useState } from 'react';
import { HelpCircle, ChevronDown, Search, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqData: FAQItem[] = [
    {
        category: 'Umum',
        question: 'Apa itu website ini?',
        answer: 'Kami adalah platform streaming anime dengan koleksi lengkap, subtitle Indonesia berkualitas, dan pengalaman menonton tanpa iklan yang mengganggu.',
    },
    {
        category: 'Umum',
        question: 'Apakah website ini gratis?',
        answer: 'Ya! Kami sepenuhnya gratis untuk digunakan. Kami menyediakan layanan streaming anime tanpa biaya berlangganan.',
    },
    {
        category: 'Akun',
        question: 'Bagaimana cara membuat akun?',
        answer: 'Klik tombol "Daftar" di navbar, isi formulir dengan nama, email, dan password. Setelah itu, Anda bisa langsung menggunakan akun untuk menyimpan progress tontonan dan watchlist.',
    },
    {
        category: 'Akun',
        question: 'Lupa password, bagaimana cara reset?',
        answer: 'Klik "Lupa Password" di halaman login, masukkan email Anda, dan ikuti instruksi yang dikirim ke email untuk mereset password.',
    },
    {
        category: 'Streaming',
        question: 'Video tidak bisa diputar, apa yang harus dilakukan?',
        answer: 'Coba refresh halaman, clear cache browser, atau ganti ke server lain jika tersedia. Jika masalah berlanjut, hubungi support kami.',
    },
    {
        category: 'Streaming',
        question: 'Mengapa kualitas video rendah?',
        answer: 'Kualitas video menyesuaikan dengan kecepatan internet Anda. Pastikan koneksi stabil untuk kualitas terbaik. Anda juga bisa memilih kualitas manual jika tersedia.',
    },
    {
        category: 'Streaming',
        question: 'Apakah bisa download anime?',
        answer: 'Saat ini kami hanya menyediakan layanan streaming. Fitur download belum tersedia untuk mematuhi kebijakan hak cipta.',
    },
    {
        category: 'Konten',
        question: 'Bagaimana cara request anime baru?',
        answer: 'Anda bisa menghubungi kami melalui halaman Contact atau Discord. Kami akan berusaha menambahkan anime yang direquest jika memungkinkan.',
    },
    {
        category: 'Konten',
        question: 'Kenapa subtitle tidak sinkron?',
        answer: 'Jika subtitle tidak sinkron, coba refresh halaman atau laporkan ke kami melalui halaman Contact agar bisa diperbaiki.',
    },
    {
        category: 'Lainnya',
        question: 'Apakah ada aplikasi mobile?',
        answer: 'Saat ini belum ada aplikasi native, tapi website kami sudah responsive dan bisa diakses dengan nyaman dari smartphone.',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const categories = [...new Set(faqData.map(faq => faq.category))];

    const filteredFAQs = faqData.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#0F0F1A] pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] mb-6 shadow-xl shadow-[#6C5DD3]/30">
                        <HelpCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Pertanyaan Umum (FAQ)</h1>
                    <p className="text-white/50">
                        Temukan jawaban untuk pertanyaan yang sering diajukan
                    </p>
                </motion.div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari pertanyaan..."
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3]"
                    />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!selectedCategory
                                ? 'bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                    >
                        Semua
                    </button>
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === category
                                    ? 'bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-3">
                    {filteredFAQs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left"
                            >
                                <span className="font-medium text-white pr-4">{faq.question}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-white/50 transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="px-6 pb-4 text-white/70">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* No Results */}
                {filteredFAQs.length === 0 && (
                    <div className="text-center py-12">
                        <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/50">Tidak ada pertanyaan yang cocok</p>
                    </div>
                )}

                {/* Contact CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 p-6 bg-gradient-to-r from-[#6C5DD3]/20 to-[#00C2FF]/20 rounded-2xl border border-white/10 text-center"
                >
                    <MessageCircle className="w-8 h-8 text-white/50 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Masih ada pertanyaan?</h3>
                    <p className="text-white/50 mb-4">Tim support kami siap membantu</p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        Hubungi Support
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
