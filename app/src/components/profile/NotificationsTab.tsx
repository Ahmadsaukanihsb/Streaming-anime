// NotificationsTab component
import { Bell, Trash2, Eye, Trophy, MessageCircle, Heart } from 'lucide-react';
import type { Notification } from '@/context/AppContext';
import type { Anime } from '@/data/animeData';

interface NotificationsTabProps {
  notifications: Notification[];
  subscribedAnimeIds: string[];
  animeList: Anime[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onUnsubscribe: (animeId: string) => void;
  loadingSubscriptions: boolean;
}

const getNotificationMeta = (type: string) => {
  switch (type) {
    case 'new_episode':
    case 'episode':
      return { icon: <Eye className="w-5 h-5" />, badgeClass: 'bg-[#6C5DD3]/20 text-[#6C5DD3]' };
    case 'anime':
      return { icon: <Trophy className="w-5 h-5" />, badgeClass: 'bg-green-500/20 text-green-400' };
    case 'reply':
      return { icon: <MessageCircle className="w-5 h-5" />, badgeClass: 'bg-blue-500/20 text-blue-400' };
    case 'like_discussion':
    case 'like_reply':
      return { icon: <Heart className="w-5 h-5" />, badgeClass: 'bg-red-500/20 text-red-400' };
    default:
      return { icon: <Bell className="w-5 h-5" />, badgeClass: 'bg-yellow-500/20 text-yellow-400' };
  }
};

export default function NotificationsTab({
  notifications,
  subscribedAnimeIds,
  animeList,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onUnsubscribe,
  loadingSubscriptions,
}: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      {/* Mark All as Read button */}
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onMarkAllRead}
            className="text-sm text-[#6C5DD3] hover:text-white transition-colors"
          >
            Tandai semua telah dibaca ({unreadCount})
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
                  <img
                    src={anime.poster}
                    alt={anime.title}
                    className="w-full aspect-[3/4] object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h4 className="font-medium text-white text-sm line-clamp-1">{anime.title}</h4>
                    <p className="text-xs text-green-400 mt-1">{anime.status === 'Ongoing' ? '🔔 Aktif' : '✓ Selesai'}</p>
                  </div>
                  <button
                    onClick={() => onUnsubscribe(animeId)}
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
            {notifications.map((notif) => {
              const { icon, badgeClass } = getNotificationMeta(notif.type);
              const primaryText = notif.message || notif.title || 'Notifikasi';
              const secondaryText = notif.discussionTitle || notif.animeTitle;
              return (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && onMarkRead(notif._id)}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer ${notif.isRead ? 'bg-white/5' : 'bg-[#6C5DD3]/10 border border-[#6C5DD3]/30'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${badgeClass}`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${notif.isRead ? 'text-white/70' : 'text-white font-medium'}`}>{primaryText}</p>
                    {secondaryText && <p className="text-xs text-white/40">{secondaryText}</p>}
                    <p className="text-xs text-white/30 mt-1">{new Date(notif.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  {!notif.isRead && <span className="w-2 h-2 bg-[#6C5DD3] rounded-full" />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-white/5 rounded-xl">
            <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">Belum ada notifikasi</p>
          </div>
        )}
      </div>
    </div>
  );
}
