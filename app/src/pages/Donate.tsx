import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartHandshake, HandCoins, QrCode, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { StaticPageSEO } from '@/components/Seo';

export default function Donate() {
  const benefits = [
    {
      icon: Sparkles,
      title: 'Kualitas Streaming',
      description: 'Menjaga server tetap stabil dan cepat untuk semua pengguna.',
    },
    {
      icon: ShieldCheck,
      title: 'Subtitle Lebih Baik',
      description: 'Mendukung proses kurasi dan kualitas subtitle Indonesia.',
    },
    {
      icon: HeartHandshake,
      title: 'Komunitas Berkelanjutan',
      description: 'Membangun komunitas anime yang sehat dan terus berkembang.',
    },
  ];

  const methods = [
    {
      icon: HandCoins,
      title: 'Transfer Bank',
      description: 'Dukungan via transfer bank lokal. Detail akan kami kirimkan lewat kontak.',
    },
    {
      icon: CreditCard,
      title: 'E-Wallet',
      description: 'OVO, DANA, GoPay, dan lainnya. Hubungi kami untuk nomor tujuan.',
    },
    {
      icon: QrCode,
      title: 'QRIS',
      description: 'Scan QRIS untuk donasi cepat. Minta QR resmi melalui kontak.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F1A] pt-24 pb-16">
      <StaticPageSEO
        title="Donasi"
        description="Dukung Animeku agar tetap gratis, cepat, dan berkualitas. Setiap donasi membantu server, subtitle, dan komunitas."
        canonical="/donate"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] mb-6 shadow-xl shadow-[#6C5DD3]/30">
            <HeartHandshake className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Dukung Animeku</h1>
          <p className="text-white/50 max-w-2xl mx-auto">
            Animeku terus berupaya menyediakan streaming anime sub indo yang cepat dan nyaman.
            Dukungan kamu membantu kami menjaga server, subtitle, dan komunitas tetap berjalan.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-[#6C5DD3]/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{benefit.title}</h3>
              <p className="text-sm text-white/50">{benefit.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold text-white mb-6 text-center">Metode Donasi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {methods.map((method) => (
              <div
                key={method.title}
                className="p-6 bg-white/5 rounded-2xl border border-white/10"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <method.icon className="w-5 h-5 text-white/70" />
                  </div>
                  <h3 className="font-semibold text-white">{method.title}</h3>
                </div>
                <p className="text-sm text-white/50">{method.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center p-8 bg-gradient-to-r from-[#6C5DD3]/20 to-[#00C2FF]/20 rounded-3xl border border-white/10"
        >
          <h3 className="text-xl font-bold text-white mb-2">Siap Berdonasi?</h3>
          <p className="text-white/50 mb-6">
            Hubungi kami untuk mendapatkan nomor rekening atau QR resmi.
          </p>
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
