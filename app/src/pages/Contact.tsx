import { useState } from 'react';
import { Mail, MessageCircle, Send, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate form submission
        setIsSubmitted(true);
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 3000);
    };

    const contactInfo = [
        { icon: Mail, label: 'Email', value: 'support@animestream.id' },
        { icon: MessageCircle, label: 'Discord', value: 'AnimeStream Community' },
        { icon: Clock, label: 'Jam Operasional', value: '24/7 Online Support' },
    ];

    return (
        <div className="min-h-screen bg-[#0F0F1A] pt-24 pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C2FF] to-[#6C5DD3] mb-6 shadow-xl shadow-[#00C2FF]/30">
                        <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Hubungi Kami</h1>
                    <p className="text-white/50 max-w-2xl mx-auto">
                        Ada pertanyaan, saran, atau masalah? Kami siap membantu!
                    </p>
                </motion.div>

                {/* Contact Info Cards - Horizontal on desktop */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
                >
                    {contactInfo.map((info) => (
                        <div
                            key={info.label}
                            className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center flex-shrink-0">
                                    <info.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-white/50">{info.label}</p>
                                    <p className="font-medium text-white truncate">{info.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Contact Form - Full width */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 bg-white/5 rounded-3xl border border-white/10">
                        {isSubmitted ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-12"
                            >
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Pesan Terkirim!</h3>
                                <p className="text-white/50">Terima kasih, kami akan segera merespons</p>
                            </motion.div>
                        ) : (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">Nama</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3] transition-colors"
                                            placeholder="Nama lengkap"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-white/70 text-sm mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3] transition-colors"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Subjek</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3] transition-colors"
                                        placeholder="Topik pesan"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Pesan</label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        rows={6}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3] resize-none transition-colors"
                                        placeholder="Tulis pesan Anda..."
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] hover:opacity-90"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Kirim Pesan
                                </Button>
                            </div>
                        )}
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
