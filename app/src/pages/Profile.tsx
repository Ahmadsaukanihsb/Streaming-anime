import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Profile page with modular components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/lib/api';
import { getAuthHeaders } from '@/lib/auth';
import { BACKEND_URL } from '@/config/api';
import { ProfileHeader } from '@/components/profile';
import HistoryTab from '@/components/profile/HistoryTab';
import BookmarksTab from '@/components/profile/BookmarksTab';
import WatchlistTab from '@/components/profile/WatchlistTab';
import RatingsTab from '@/components/profile/RatingsTab';
import NotificationsTab from '@/components/profile/NotificationsTab';
import SettingsTab from '@/components/profile/SettingsTab';
import AchievementsTab from '@/components/profile/AchievementsTab';
import { useAchievements } from '@/hooks/useAchievements';

// Icons
import { Clock, Bookmark, ListVideo, Star, Bell, Settings, Play, Trophy } from 'lucide-react';

export default function Profile() {
  const {
    user,
    logout,
    updateProfile,
    updateAvatar,
    bookmarks,
    watchlist,
    watchHistory,
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

  // Avatar upload handled in ProfileHeader

  // Fetch subscriptions
  useEffect(() => {
    if (!user) return;
    const fetchSubscriptions = async () => {
      try {
        const res = await apiFetch(`${BACKEND_URL}/api/schedule-subscriptions?userId=${user.id}`, {
          headers: { ...getAuthHeaders() }
        });
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

  const handleUnsubscribe = async (animeId: string) => {
    if (!user) return;
    setLoadingSubscriptions(true);
    try {
      await apiFetch(`${BACKEND_URL}/api/schedule-subscriptions/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: user.id, animeId })
      });
      setSubscribedAnimeIds(prev => prev.filter(id => id !== animeId));
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleDeleteRating = async (animeId: string) => {
    await deleteRating(animeId);
  };



  const handleChangePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/users/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
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
  };

  // Calculate stats
  const totalWatchHours = Math.round((watchHistory.length * 24) / 60);
  const stats = {
    watched: watchHistory.length,
    bookmarks: bookmarks.length,
    watchlist: watchlist.length,
    hours: totalWatchHours
  };

  // Get recently watched anime for history
  const recentWatchHistory = [...watchHistory]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  // Calculate achievements
  const { unlockedAchievements, totalPoints } = useAchievements(
    watchHistory,
    ratings,
    bookmarks,
    watchlist,
    animeList
  );

  // Get bookmarked anime
  const bookmarkedAnime = animeList.filter(a => bookmarks.includes(a.id));

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

  return (
    <main className="min-h-screen bg-[#0F0F1A] pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <ProfileHeader
          user={user}
          stats={[
            { label: 'Anime Ditonton', value: stats.watched, icon: Play },
            { label: 'Bookmark', value: stats.bookmarks, icon: Bookmark },
            { label: 'Watchlist', value: stats.watchlist, icon: ListVideo },
            { label: 'Jam Menonton', value: stats.hours, icon: Clock },
          ]}
          achievements={unlockedAchievements}
          totalPoints={totalPoints}
          onLogout={logout}
          onUpdateProfile={updateProfile}
          onUpdateAvatar={updateAvatar}
        />

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
              value="achievements"
              className="flex-1 data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white text-white/70 text-[10px] sm:text-sm py-2 px-0.5 sm:px-3 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Achievement</span>
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
            <HistoryTab
              watchHistory={recentWatchHistory}
              animeList={animeList}
            />
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks">
            <BookmarksTab bookmarkedAnime={bookmarkedAnime} />
          </TabsContent>

          {/* Watchlist Tab */}
          <TabsContent value="watchlist">
            <WatchlistTab
              watchlist={watchlist}
              animeList={animeList}
              onRemove={() => {}}
            />
          </TabsContent>

          {/* Ratings Tab */}
          <TabsContent value="ratings">
            <RatingsTab
              ratings={ratings}
              animeList={animeList}
              onDeleteRating={handleDeleteRating}
            />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationsTab
              notifications={notifications}
              subscribedAnimeIds={subscribedAnimeIds}
              animeList={animeList}
              unreadCount={unreadNotificationCount}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
              onUnsubscribe={handleUnsubscribe}
              loadingSubscriptions={loadingSubscriptions}
            />
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <AchievementsTab
              watchHistory={watchHistory}
              ratings={ratings}
              bookmarks={bookmarks}
              watchlist={watchlist}
              animeList={animeList}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SettingsTab 
              user={user} 
              userSettings={userSettings}
              onChangePassword={handleChangePassword}
              onUpdateSettings={updateSettings}
              onDeleteWatchHistory={deleteWatchHistory}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1A1A2E] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profil</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4 mt-4">
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
    </main>
  );
}
