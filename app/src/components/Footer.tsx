import { Link } from 'react-router-dom';
import { Film, Heart, Github, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DEFAULT_SITE_NAME } from '../config/api';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [siteLogo, setSiteLogo] = useState('');
  
  useEffect(() => {
    const storedName = localStorage.getItem('siteName');
    const storedLogo = localStorage.getItem('siteLogo');
    if (storedName) setSiteName(storedName);
    if (storedLogo) setSiteLogo(storedLogo);
    
    // Listen for custom event (from same tab)
    const handleLogoUpdate = (e: CustomEvent) => {
      setSiteLogo(e.detail);
      // Also update favicon
      localStorage.setItem('siteFavicon', e.detail);
      const faviconLink = document.getElementById('site-favicon') as HTMLLinkElement;
      if (faviconLink) faviconLink.href = `${e.detail}?v=${Date.now()}`;
    };
    
    // Listen for BroadcastChannel messages
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('site-settings');
      bc.onmessage = (event) => {
        if (event.data.type === 'logoUpdated') {
          setSiteLogo(event.data.logo);
          // Also update favicon
          localStorage.setItem('siteFavicon', event.data.logo);
          const faviconLink = document.getElementById('site-favicon') as HTMLLinkElement;
          if (faviconLink) faviconLink.href = `${event.data.logo}?v=${Date.now()}`;
        }
      };
    }
    
    window.addEventListener('siteLogoUpdated', handleLogoUpdate as EventListener);
    
    return () => {
      window.removeEventListener('siteLogoUpdated', handleLogoUpdate as EventListener);
      bc?.close();
    };
  }, []);

  const footerLinks = {
    navigasi: [
      { label: 'Home', href: '/' },
      { label: 'Anime List', href: '/anime-list' },
      { label: 'Genres', href: '/genres' },
      { label: 'Jadwal Rilis', href: '/schedule' },
    ],
    informasi: [
      { label: 'Tentang Kami', href: '/about' },
      { label: 'Kontak', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Kebijakan Privasi', href: '/privacy' },
    ],
    komunitas: [
      // { label: 'Discord', href: '#' },
      // { label: 'Forum', href: '/forum' },
      // { label: 'Blog', href: '/blog' },
      { label: 'Donasi', href: '/donate' },
    ],
  };

  const socialLinks = [
    // { icon: Twitter, href: '#', label: 'Twitter' },
    // { icon: Instagram, href: '#', label: 'Instagram' },
    // { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Mail, href: 'mailto:support@animestream.id', label: 'Email' },
  ];

  return (
    <footer className="relative bg-[#0a0a12] border-t border-white/5">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${siteLogo ? 'bg-transparent' : 'bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF]'}`}>
                {siteLogo ? (
                  <img src={siteLogo} alt={siteName} className="w-full h-full object-contain" />
                ) : (
                  <Film className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-xl font-bold font-heading text-white">
                {siteName}
              </span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-6">
              Platform streaming anime terbaik dengan kualitas HD dan subtitle Indonesia.
              Nikmati pengalaman menonton anime tanpa iklan yang mengganggu.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#6C5DD3] flex items-center justify-center transition-colors group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navigasi</h3>
            <ul className="space-y-3">
              {footerLinks.navigasi.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-white/50 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Informasi</h3>
            <ul className="space-y-3">
              {footerLinks.informasi.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-white/50 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Komunitas</h3>
            <ul className="space-y-3">
              {footerLinks.komunitas.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-white/50 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm text-center sm:text-left">
              &copy; {currentYear} {siteName}. All rights reserved.
            </p>
            <p className="flex items-center gap-1 text-white/40 text-sm">
              Dibuat dengan <Heart className="w-4 h-4 text-red-500 fill-current" /> untuk para wibu
            </p>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6C5DD3]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#00C2FF]/5 rounded-full blur-3xl pointer-events-none" />
    </footer>
  );
}
