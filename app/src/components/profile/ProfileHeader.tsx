import React, { useRef, useState } from 'react';
// ProfileHeader component
import { motion } from 'framer-motion';
import { Mail, Calendar, Settings, LogOut, Edit3, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import RoleBadge from '@/components/RoleBadge';
import SafeAvatar from '@/components/SafeAvatar';
import { AchievementBadge } from './AchievementBadge';
import type { User } from '@/context/AppContext';
import type { AchievementWithProgress } from '@/hooks/useAchievements';

interface ProfileHeaderProps {
  user: User;
  stats: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }[];
  achievements?: AchievementWithProgress[];
  totalPoints?: number;
  onLogout: () => void;
  onUpdateProfile: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateAvatar: (file: File) => Promise<{ success: boolean; error?: string }>;
}

export default function ProfileHeader({
  user,
  stats,
  achievements = [],
  totalPoints = 0,
  onLogout,
  onUpdateProfile,
  onUpdateAvatar,
}: ProfileHeaderProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    setAvatarLoading(true);
    const result = await onUpdateAvatar(file);
    setAvatarLoading(false);

    if (!result.success) {
      alert(result.error || 'Gagal mengupload avatar');
    }

    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess(false);

    const result = await onUpdateProfile(editName, editEmail);

    if (result.success) {
      setEditSuccess(true);
      setTimeout(() => setIsEditDialogOpen(false), 1000);
    } else {
      setEditError(result.error || 'Gagal menyimpan perubahan');
    }
    setEditLoading(false);
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'Baru Bergabung';
    const date = new Date(dateString);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `Bergabung ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-8"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#6C5DD3]/30 via-[#6C5DD3]/10 to-transparent rounded-2xl blur-xl" />

      <div className="relative bg-[#1A1A2E]/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
            <SafeAvatar
              src={user.avatar}
              name={user.name}
              className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-white/20 ${avatarLoading ? 'opacity-50' : ''}`}
              imgClassName="object-cover"
              fallbackBgClassName={user.isAdmin ? 'bg-gradient-to-br from-red-500 to-rose-600' : undefined}
              fallbackClassName="text-xl"
            />
            {avatarLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#6C5DD3] to-[#5a4ec0] rounded-lg flex items-center justify-center hover:scale-110 transition-transform shadow-lg disabled:opacity-50"
            >
              <Edit3 className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{user.name}</h1>
              {user.communityRole && <RoleBadge role={user.communityRole} size="md" />}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-white/60 text-sm">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </span>
              <span className="hidden sm:inline text-white/30">•</span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatJoinDate(user.createdAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center sm:justify-end">
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (open) {
                setEditName(user.name);
                setEditEmail(user.email);
                setEditError('');
                setEditSuccess(false);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all text-xs sm:text-sm">
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Profil</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1A1A2E] border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Edit Profil</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  {editError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      {editError}
                    </div>
                  )}
                  {editSuccess && (
                    <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                      Profil berhasil diperbarui!
                    </div>
                  )}
                  <div>
                    <label className="text-white/70 text-sm">Nama</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#6C5DD3]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full mt-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#6C5DD3]"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={editLoading}
                    className="w-full bg-[#6C5DD3] hover:bg-[#5a4ec0] disabled:opacity-50"
                  >
                    {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-xs sm:text-sm"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6 sm:mt-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#6C5DD3]/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/5 hover:bg-white/10 rounded-xl p-3 sm:p-4 text-center transition-colors border border-transparent hover:border-white/10">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#6C5DD3] mx-auto mb-1 sm:mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/50 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Achievement Badges */}
        {achievements.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white/60 text-sm">Achievement Terbaru</span>
              </div>
              <span className="text-[#6C5DD3] text-sm font-medium">{totalPoints} poin</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements
                .filter(a => a.unlocked)
                .slice(-6)
                .map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    unlocked={achievement.unlocked}
                    size="sm"
                  />
                ))}
              {achievements.filter(a => a.unlocked).length === 0 && (
                <p className="text-white/30 text-sm">Belum ada achievement terbuka</p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
