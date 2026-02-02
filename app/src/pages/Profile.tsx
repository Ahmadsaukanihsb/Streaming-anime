import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Calendar,
  Clock,
  Bookmark,
  ListVideo,
  Settings,
  LogOut,
  Edit3,
  Play,
  Star,
  Bell,
  Eye,
  Trophy,
  TrendingUp,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import RoleBadge from '@/components/RoleBadge';
import { BACKEND_URL } from '@/config/api';

export default function Profile() {
  const {
    user,
    logout,
    updateProfile,
    updateAvatar,
    bookmarks,
    watchlist,
    watchHistory,
    // Database-backed features
    animeList,
    ratings,
    deleteRating,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationCount,
    userSettings,
    updateSettings,
    deleteWatchHistory,
  } = useApp();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [subscribedAnimeIds, setSubscribedAnimeIds] = useState<string[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  // Edit profile form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  // Avatar upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Handle avatar file selection
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    setAvatarLoading(true);
    const result = await updateAvatar(file);
    setAvatarLoading(false);

    if (!result.success) {
      alert(result.error || 'Gagal mengupload avatar');
    }

    // Reset input
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  // Fetch subscriptions from backend
  useEffect(() => {
    if (!user) return;
    const fetchSubscriptions = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/schedule-subscriptions?userId=${user.id}`);
        const data = await res.json();
        if (data.subscriptions) {
          setSubscribedAnimeIds(data.subscriptions.map((s: { animeId: string }) => s.animeId));
        }
      } catch (err) {
        console.error('Failed to fetch subscriptions:', err);
      }
    };
    fetchSubscriptions();
  }, [user]);

  // Unsubscribe from anime
  const handleUnsubscribe = async (animeId: string) => {
    if (!user) return;
    setLoadingSubscriptions(true);
    try {
      await fetch(`${BACKEND_URL}/api/schedule-subscriptions/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, animeId })
      });
      setSubscribedAnimeIds(prev => prev.filter(id => id !== animeId));
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Silakan Login</h1>
          <p className="text-white/50 mb-6">Anda harus login untuk melihat profil</p>
          <Link to="/login" className="btn-primary">Masuk</Link>
        </div>
      </div>
    );
  }

  const bookmarkedAnime = animeList.filter(a => bookmarks.includes(a.id));
  const watchlistAnime = animeList.filter(a => watchlist.includes(a.id));

  // Get recently watched anime
  const recentlyWatched = watchHistory
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map(h => {
      const anime = animeList.find(a => a.id === h.animeId);
      return { ...h, anime };
    })
    .filter(h => h.anime);

  // Format join date
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'Baru Bergabung';
    const date = new Date(dateString);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `Bergabung ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calculate total watch hours (estimate: ~24 min per episode on average)
  const totalWatchHours = Math.round((watchHistory.length * 24) / 60);

  const stats = [
    { label: 'Anime Ditonton', value: watchHistory.length, icon: Play },
    { label: 'Bookmark', value: bookmarks.length, icon: Bookmark },
    { label: 'Watchlist', value: watchlist.length, icon: ListVideo },
    { label: 'Jam Menonton', value: totalWatchHours, icon: Clock },
  ];

  return (
    <main className="min-h-screen bg-[#0F0F1A] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          {/* Background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6C5DD3]/30 via-[#6C5DD3]/10 to-transparent rounded-2xl blur-xl" />

          <div className="relative bg-[#1A1A2E]/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10">
            {/* Top section: Avatar + Info + Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar with glow */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white/20 ${avatarLoading ? 'opacity-50' : ''}`}
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
                  if (open && user) {
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
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setEditLoading(true);
                      setEditError('');
                      setEditSuccess(false);

                      const result = await updateProfile(editName, editEmail);

                      if (result.success) {
                        setEditSuccess(true);
                        setTimeout(() => setIsEditDialogOpen(false), 1000);
                      } else {
                        setEditError(result.error || 'Gagal menyimpan perubahan');
                      }
                      setEditLoading(false);
                    }} className="space-y-4 mt-4">
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
                  onClick={logout}
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
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="flex w-full bg-white/5 border border-white/10 rounded-xl p-1.5 mb-4 sm:mb-6">
            <TabsTrigger
              value="history"
              className="flex-1 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-[10px] sm:text-sm py-2 px-0.5 sm:px-3 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Riwayat</span>
            </TabsTrigger>
            <TabsTrigger
              value="bookmarks"
              className="flex-1 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-[10px] sm:text-sm py-2 px-0.5 sm:px-3 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2"
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Bookmark</span>
            </TabsTrigger>
            <TabsTrigger
              value="watchlist"
              className="flex-1 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-[10px] sm:text-sm py-2 px-0.5 sm:px-3 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2"
            >
              <ListVideo className="w-4 h-4" />
              <span className="hidden sm:inline">Watchlist</span>
            </TabsTrigger>
            <TabsTrigger
              value="ratings"
              className="flex-1 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-[10px] sm:text-sm py-2 px-0.5 sm:px-3 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2"
            >
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Rating</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex-1 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-[10px] sm:text-sm py-2 px-0.5 sm:px-3 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifikasi</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex-1 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-[10px] sm:text-sm py-2 px-0.5 sm:px-3 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Pengaturan</span>
            </TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history">
            {recentlyWatched.length > 0 ? (
              <div className="space-y-4">
                {recentlyWatched.map((item, index) => (
                  <motion.div
                    key={`${item.animeId}-${item.episodeNumber}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col xs:flex-row items-start xs:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <img
                      src={item.anime?.poster}
                      alt={item.anime?.title}
                      className="w-16 h-22 sm:w-20 sm:h-28 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 w-full xs:w-auto">
                      <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-1">{item.anime?.title}</h3>
                      <p className="text-white/50 text-xs sm:text-sm">Episode {item.episodeNumber}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-white/50 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(item.progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#6C5DD3] rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/watch/${item.animeId}/${item.episodeNumber}`}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#6C5DD3] text-white text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-[#5a4ec0] transition-colors w-full xs:w-auto text-center"
                    >
                      Lanjutkan
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Riwayat</h3>
                <p className="text-white/50 mb-6">Mulai menonton anime untuk melihat riwayat di sini</p>
                <Link to="/" className="btn-primary">Jelajahi Anime</Link>
              </div>
            )}
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks">
            {bookmarkedAnime.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {bookmarkedAnime.map((anime, index) => (
                  <motion.div
                    key={anime.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/anime/${anime.id}`} className="group block relative aspect-[3/4] rounded-xl overflow-hidden">
                      <img
                        src={anime.poster}
                        alt={anime.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-semibold text-white text-sm line-clamp-2">{anime.title}</h3>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Bookmark</h3>
                <p className="text-white/50 mb-6">Simpan anime favoritmu untuk akses cepat</p>
                <Link to="/" className="btn-primary">Jelajahi Anime</Link>
              </div>
            )}
          </TabsContent>

          {/* Watchlist Tab */}
          <TabsContent value="watchlist">
            {watchlistAnime.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {watchlistAnime.map((anime, index) => (
                  <motion.div
                    key={anime.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/anime/${anime.id}`} className="group block relative aspect-[3/4] rounded-xl overflow-hidden">
                      <img
                        src={anime.poster}
                        alt={anime.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-semibold text-white text-sm line-clamp-2">{anime.title}</h3>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListVideo className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Watchlist Kosong</h3>
                <p className="text-white/50 mb-6">Tambahkan anime yang ingin kamu tonton nanti</p>
                <Link to="/" className="btn-primary">Jelajahi Anime</Link>
              </div>
            )}
          </TabsContent>

          {/* Ratings Tab */}
          <TabsContent value="ratings">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Anime yang Sudah Anda Rating</h3>
                <span className="text-white/50 text-sm">Total: {ratings.length} anime</span>
              </div>
              {ratings.length > 0 ? (
                <>
                  {ratings.map((ratingData, index) => {
                    const anime = animeList.find(a => a.id === ratingData.animeId);
                    if (!anime) return null;
                    return (
                      <motion.div
                        key={ratingData.animeId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <img src={anime.poster} alt={anime.title} className="w-16 h-20 object-cover rounded-lg" />
                        <div className="flex-1">
                          <Link to={`/anime/${anime.id}`} className="font-semibold text-white hover:text-[#6C5DD3]">{anime.title}</Link>
                          <div className="flex items-center gap-1 mt-2">
                            {Array.from({ length: 10 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < ratingData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                              />
                            ))}
                            <span className="ml-2 text-yellow-400 font-medium">{ratingData.rating}/10</span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteRating(ratingData.animeId)}
                          className="p-2 text-white/40 hover:text-red-400 transition-colors"
                          title="Hapus rating"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Belum Ada Rating</h3>
                  <p className="text-white/50 mb-6">Rating anime yang sudah Anda tonton untuk rekomendasi lebih baik</p>
                  <Link to="/" className="btn-primary">Jelajahi Anime</Link>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="space-y-6">
              {/* Mark All as Read button */}
              {unreadNotificationCount > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="text-sm text-[#6C5DD3] hover:text-white transition-colors"
                  >
                    Tandai semua telah dibaca ({unreadNotificationCount})
                  </button>
                </div>
              )}

              {/* Subscribed Anime */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#6C5DD3]" />
                  Anime yang Anda Ikuti ({subscribedAnimeIds.length})
                </h3>
                {subscribedAnimeIds.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {subscribedAnimeIds.map((animeId: string) => {
                      const anime = animeList.find(a => a.id === animeId);
                      if (!anime) return null;
                      return (
                        <div key={animeId} className="relative group rounded-xl overflow-hidden">
                          <img src={anime.poster} alt={anime.title} className="w-full aspect-[3/4] object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h4 className="font-medium text-white text-sm line-clamp-1">{anime.title}</h4>
                            <p className="text-xs text-green-400 mt-1">{anime.status === 'Ongoing' ? '🔔 Aktif' : '✓ Selesai'}</p>
                          </div>
                          <button
                            onClick={() => handleUnsubscribe(animeId)}
                            disabled={loadingSubscriptions}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white/5 rounded-xl">
                    <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50">Belum mengikuti anime apapun</p>
                  </div>
                )}
              </div>

              {/* Recent Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Notifikasi Terbaru</h3>
                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => notif._id && !notif.read && markNotificationRead(notif._id)}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer ${notif.read ? 'bg-white/5' : 'bg-[#6C5DD3]/10 border border-[#6C5DD3]/30'}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${notif.type === 'episode' ? 'bg-[#6C5DD3]/20 text-[#6C5DD3]' : notif.type === 'anime' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {notif.type === 'episode' ? <Eye className="w-5 h-5" /> : notif.type === 'anime' ? <Trophy className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${notif.read ? 'text-white/70' : 'text-white font-medium'}`}>{notif.title}</p>
                          <p className="text-xs text-white/40">{notif.message}</p>
                          <p className="text-xs text-white/30 mt-1">{new Date(notif.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                        {!notif.read && <span className="w-2 h-2 bg-[#6C5DD3] rounded-full" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white/5 rounded-xl">
                    <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50">Belum ada notifikasi</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="max-w-2xl space-y-6">
              {/* Playback Settings */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#6C5DD3]" />
                  Pengaturan Playback
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Auto-Play Episode Selanjutnya</p>
                      <p className="text-white/50 text-sm">Otomatis putar episode berikutnya</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ autoPlayNext: !userSettings.autoPlayNext })}
                      className={`w-12 h-6 rounded-full p-1 flex items-start transition-colors ${userSettings.autoPlayNext ? 'bg-[#6C5DD3]' : 'bg-white/20'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${userSettings.autoPlayNext ? 'ml-auto' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Skip Intro Otomatis</p>
                      <p className="text-white/50 text-sm">Lewati intro saat tersedia</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ autoSkipIntro: !userSettings.autoSkipIntro })}
                      className={`w-12 h-6 rounded-full p-1 flex items-start transition-colors ${userSettings.autoSkipIntro ? 'bg-[#6C5DD3]' : 'bg-white/20'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${userSettings.autoSkipIntro ? 'ml-auto' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Kualitas Default</p>
                      <p className="text-white/50 text-sm">Pilih kualitas video default</p>
                    </div>
                    <select
                      value={userSettings.defaultQuality}
                      onChange={(e) => updateSettings({ defaultQuality: e.target.value as '480' | '720' | '1080' | 'auto' })}
                      className="bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10"
                    >
                      <option value="480">480p</option>
                      <option value="720">720p</option>
                      <option value="1080">1080p</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#6C5DD3]" />
                  Pengaturan Notifikasi
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Episode Baru</p>
                      <p className="text-white/50 text-sm">Notif saat anime favorit rilis episode baru</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ notifyNewEpisode: !userSettings.notifyNewEpisode })}
                      className={`w-12 h-6 rounded-full p-1 flex items-start transition-colors ${userSettings.notifyNewEpisode ? 'bg-[#6C5DD3]' : 'bg-white/20'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${userSettings.notifyNewEpisode ? 'ml-auto' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Anime Baru</p>
                      <p className="text-white/50 text-sm">Notif saat anime baru ditambahkan</p>
                    </div>
                    <button
                      onClick={() => updateSettings({ notifyNewAnime: !userSettings.notifyNewAnime })}
                      className={`w-12 h-6 rounded-full p-1 flex items-start transition-colors ${userSettings.notifyNewAnime ? 'bg-[#6C5DD3]' : 'bg-white/20'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all ${userSettings.notifyNewAnime ? 'ml-auto' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Zona Berbahaya</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Hapus Riwayat Tontonan</p>
                      <p className="text-white/50 text-sm">Menghapus semua riwayat menonton Anda</p>
                    </div>
                    <Button
                      onClick={() => deleteWatchHistory()}
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Hapus Akun</p>
                      <p className="text-white/50 text-sm">Menghapus akun dan semua data Anda secara permanen</p>
                    </div>
                    <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Akun
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
