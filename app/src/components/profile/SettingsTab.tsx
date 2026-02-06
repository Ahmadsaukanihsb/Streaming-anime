import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Globe, Bell, Shield, Palette, KeyRound, Check, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettingsTabProps {
  user: any;
  userSettings?: {
    autoPlayNext?: boolean;
    autoSkipIntro?: boolean;
    defaultQuality?: '480' | '720' | '1080' | 'auto';
    notifyNewEpisode?: boolean;
    notifyNewAnime?: boolean;
  };
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  onUpdateSettings?: (settings: any) => void;
  onDeleteWatchHistory?: () => void;
}

export default function SettingsTab({ 
  user, 
  userSettings = {}, 
  onChangePassword,
  onUpdateSettings = () => {},
  onDeleteWatchHistory = () => {}
}: SettingsTabProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'preferences' | 'privacy'>('profile');
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Merge user settings with defaults
  const [localSettings, setLocalSettings] = useState({
    autoPlayNext: userSettings.autoPlayNext ?? true,
    autoSkipIntro: userSettings.autoSkipIntro ?? false,
    defaultQuality: userSettings.defaultQuality ?? '720',
    notifyNewEpisode: userSettings.notifyNewEpisode ?? true,
    notifyNewAnime: userSettings.notifyNewAnime ?? true,
    emailNotifications: true,
    language: 'id',
    theme: 'dark',
  });

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdateSettings({ [key]: value });
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Password baru tidak cocok');
      return;
    }
    
    setLoading(true);
    const success = await onChangePassword(passwordForm.oldPassword, passwordForm.newPassword);
    setLoading(false);
    
    if (success) {
      setPasswordSuccess('Password berhasil diubah');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPasswordError('Password lama salah');
    }
  };

  const menuItems = [
    { id: 'profile', label: 'Profil', icon: User, description: 'Informasi akun Anda' },
    { id: 'password', label: 'Password', icon: Lock, description: 'Ubah password' },
    { id: 'preferences', label: 'Preferensi', icon: Palette, description: 'Pengaturan tampilan & bahasa' },
    { id: 'privacy', label: 'Privasi', icon: Shield, description: 'Pengaturan privasi akun' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar Menu */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as any)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
              activeSection === item.id
                ? 'bg-[#6C5DD3] text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <div>
              <p className="font-medium">{item.label}</p>
              <p className={`text-xs ${activeSection === item.id ? 'text-white/70' : 'text-white/40'}`}>
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white/5 rounded-2xl p-6">
        {activeSection === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-xl font-semibold text-white mb-6">Informasi Profil</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/50 mb-1 block">Email</label>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <KeyRound className="w-5 h-5 text-white/30" />
                  <span className="text-white">{user.email}</span>
                </div>
                <p className="text-xs text-white/30 mt-1">Email tidak dapat diubah</p>
              </div>
              <div>
                <label className="text-sm text-white/50 mb-1 block">Role</label>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <User className="w-5 h-5 text-white/30" />
                  <span className="text-white capitalize">{user.role || 'User'}</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-white/50 mb-1 block">Bergabung</label>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <Globe className="w-5 h-5 text-white/30" />
                  <span className="text-white">{new Date(user.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'password' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-xl font-semibold text-white mb-6">Ubah Password</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/50 mb-2 block">Password Lama</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3]"
                  placeholder="Masukkan password lama"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 mb-2 block">Password Baru</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3]"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 mb-2 block">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3]"
                  placeholder="Ulangi password baru"
                />
              </div>
              {passwordError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  {passwordSuccess}
                </div>
              )}
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Ubah Password'}
              </button>
            </div>
          </motion.div>
        )}

        {activeSection === 'preferences' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-xl font-semibold text-white mb-6">Preferensi</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#6C5DD3]" />
                  <div>
                    <p className="text-white font-medium">Bahasa</p>
                    <p className="text-sm text-white/50">Bahasa tampilan aplikasi</p>
                  </div>
                </div>
                <select
                  value={localSettings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-[#6C5DD3]" />
                  <div>
                    <p className="text-white font-medium">Tema</p>
                    <p className="text-sm text-white/50">Tampilan gelap saat ini</p>
                  </div>
                </div>
                <select
                  value={localSettings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  <option value="dark">Gelap</option>
                  <option value="light">Terang</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#6C5DD3]" />
                  <div>
                    <p className="text-white font-medium">Notifikasi Email</p>
                    <p className="text-sm text-white/50">Terima update via email</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSettingChange('emailNotifications', !localSettings.emailNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${localSettings.emailNotifications ? 'bg-[#6C5DD3]' : 'bg-white/20'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${localSettings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Playback Settings */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-white font-medium mb-4">Pengaturan Video</h4>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-3">
                  <div>
                    <p className="text-white font-medium">Auto-Play Episode Selanjutnya</p>
                    <p className="text-sm text-white/50">Otomatis putar episode berikutnya</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('autoPlayNext', !localSettings.autoPlayNext)}
                    className={`w-12 h-6 rounded-full transition-colors ${localSettings.autoPlayNext ? 'bg-[#6C5DD3]' : 'bg-white/20'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${localSettings.autoPlayNext ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-3">
                  <div>
                    <p className="text-white font-medium">Skip Intro Otomatis</p>
                    <p className="text-sm text-white/50">Lewati intro saat tersedia</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('autoSkipIntro', !localSettings.autoSkipIntro)}
                    className={`w-12 h-6 rounded-full transition-colors ${localSettings.autoSkipIntro ? 'bg-[#6C5DD3]' : 'bg-white/20'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${localSettings.autoSkipIntro ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white font-medium">Kualitas Default</p>
                    <p className="text-sm text-white/50">Pilih kualitas video default</p>
                  </div>
                  <select
                    value={localSettings.defaultQuality}
                    onChange={(e) => handleSettingChange('defaultQuality', e.target.value)}
                    className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="480">480p</option>
                    <option value="720">720p</option>
                    <option value="1080">1080p</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'privacy' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-xl font-semibold text-white mb-6">Privasi Akun</h3>
            <div className="space-y-6">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-[#6C5DD3]" />
                  <p className="text-white font-medium">Profil Publik</p>
                </div>
                <p className="text-sm text-white/50 ml-8">Profil Anda dapat dilihat oleh pengguna lain</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <Bell className="w-5 h-5 text-[#6C5DD3]" />
                  <p className="text-white font-medium">Notifikasi Push</p>
                </div>
                <p className="text-sm text-white/50 ml-8">Terima notifikasi di browser</p>
              </div>
              
              {/* Danger Zone */}
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 font-medium mb-2">⚠️ Zona Berbahaya</p>
                <p className="text-sm text-white/50 mb-4">Tindakan di bawah ini tidak dapat dibatalkan</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">Hapus Riwayat Tontonan</p>
                      <p className="text-xs text-white/50">Menghapus semua riwayat menonton Anda</p>
                    </div>
                    <Button
                      onClick={onDeleteWatchHistory}
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">Hapus Akun</p>
                      <p className="text-xs text-white/50">Menghapus akun dan semua data Anda secara permanen</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/20">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Akun
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
