import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, Check, X, Play, Trash2, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { BACKEND_URL } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

interface NotificationItem {
    _id: string;
    type: 'like_discussion' | 'like_reply' | 'reply' | 'mention' | 'new_episode';
    fromUserName?: string;
    discussionId?: string;
    discussionTitle?: string;
    animeId?: string;
    animeTitle?: string;
    animePoster?: string;
    episodeNumber?: number;
    message: string;
    isRead: boolean;
    createdAt: string;
}

type NotificationGroup = {
    title: string;
    notifications: NotificationItem[];
};

export default function NotificationDropdown() {
    const { user } = useApp();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch unread count periodically
    useEffect(() => {
        if (!user) return;

        const fetchUnreadCount = async () => {
            try {
                const res = await apiFetch(`${BACKEND_URL}/api/notifications/unread-count?userId=${user.id}`, {
                    headers: { ...getAuthHeaders() }
                });
                const data = await res.json();
                setUnreadCount(data.count || 0);
            } catch (err) {
                console.error('Failed to fetch unread count:', err);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => clearInterval(interval);
    }, [user]);

    // Fetch notifications when opening dropdown
    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const res = await apiFetch(`${BACKEND_URL}/api/notifications?userId=${user.id}&limit=20`, {
                    headers: { ...getAuthHeaders() }
                });
                const data = await res.json();
                setNotifications(data.notifications || []);
            } catch (err) {
                console.error('Failed to fetch notifications:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [isOpen, user]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mark all as read
    const markAllAsRead = async () => {
        if (!user) return;

        try {
            await apiFetch(`${BACKEND_URL}/api/notifications/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ userId: user.id })
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    // Delete notification
    const deleteNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!user) return;

        try {
            await apiFetch(`${BACKEND_URL}/api/notifications/${id}?userId=${user.id}`, {
                method: 'DELETE',
                headers: { ...getAuthHeaders() }
            });
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification: NotificationItem) => {
        if (notification.type === 'new_episode' && notification.animeId) {
            navigate(`/anime/${notification.animeId}`);
        } else if (notification.discussionId) {
            navigate(`/community/discussion/${notification.discussionId}`);
        }
        setIsOpen(false);
    };

    // Get icon for notification type
    const getIcon = (type: string) => {
        switch (type) {
            case 'like_discussion':
            case 'like_reply':
                return (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-red-400 fill-current" />
                    </div>
                );
            case 'reply':
                return (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                    </div>
                );
            case 'new_episode':
                return (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-green-400 fill-current" />
                    </div>
                );
            default:
                return (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6C5DD3]/20 to-[#00C2FF]/20 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-[#6C5DD3]" />
                    </div>
                );
        }
    };

    // Format time with relative labels
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return { label: 'Baru saja', short: 'Baru' };
        if (minutes < 60) return { label: `${minutes} menit yang lalu`, short: `${minutes}m` };
        if (hours < 24) return { label: `${hours} jam yang lalu`, short: `${hours}j` };
        if (days === 1) return { label: 'Kemarin', short: '1h' };
        if (days < 7) return { label: `${days} hari yang lalu`, short: `${days}h` };
        return { label: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }), short: `${days}h` };
    };

    // Group notifications by date
    const groupNotifications = (items: NotificationItem[]): NotificationGroup[] => {
        const groups: NotificationGroup[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(thisWeekStart.getDate() - 7);

        const todayItems: NotificationItem[] = [];
        const yesterdayItems: NotificationItem[] = [];
        const thisWeekItems: NotificationItem[] = [];
        const olderItems: NotificationItem[] = [];

        items.forEach(item => {
            const itemDate = new Date(item.createdAt);
            itemDate.setHours(0, 0, 0, 0);

            if (itemDate.getTime() === today.getTime()) {
                todayItems.push(item);
            } else if (itemDate.getTime() === yesterday.getTime()) {
                yesterdayItems.push(item);
            } else if (itemDate.getTime() > thisWeekStart.getTime()) {
                thisWeekItems.push(item);
            } else {
                olderItems.push(item);
            }
        });

        if (todayItems.length) groups.push({ title: 'Hari Ini', notifications: todayItems });
        if (yesterdayItems.length) groups.push({ title: 'Kemarin', notifications: yesterdayItems });
        if (thisWeekItems.length) groups.push({ title: 'Minggu Ini', notifications: thisWeekItems });
        if (olderItems.length) groups.push({ title: 'Lebih Lama', notifications: olderItems });

        return groups;
    };

    const groupedNotifications = groupNotifications(notifications);

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button with Glow Effect */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-300 ${isOpen
                    ? 'bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/30'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 border-2 border-[#0F0F1A]"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-12 mt-2 w-auto sm:w-[400px] bg-[#1A1A2E] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                    >
                        {/* Enhanced Header */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#6C5DD3]/10 to-[#00C2FF]/5 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center shadow-lg shadow-[#6C5DD3]/20">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Notifikasi</h3>
                                    {unreadCount > 0 && (
                                        <p className="text-xs text-[#6C5DD3]">{unreadCount} belum dibaca</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={markAllAsRead}
                                        className="px-3 py-1.5 text-xs font-medium text-[#6C5DD3] hover:text-white bg-[#6C5DD3]/10 hover:bg-[#6C5DD3] rounded-lg transition-all flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" />
                                        Baca semua
                                    </motion.button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto scrollbar-hide">
                            {loading ? (
                                // Skeleton Loading
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-3 animate-pulse">
                                            <div className="w-10 h-10 rounded-full bg-white/10" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-white/10 rounded w-3/4" />
                                                <div className="h-2 bg-white/5 rounded w-1/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : notifications.length === 0 ? (
                                // Empty State
                                <div className="py-12 px-4 text-center bg-[#1A1A2E]">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#6C5DD3]/20 to-[#00C2FF]/20 flex items-center justify-center"
                                    >
                                        <Inbox className="w-8 h-8 text-[#6C5DD3]" />
                                    </motion.div>
                                    <h4 className="text-white font-medium mb-1">Tidak ada notifikasi</h4>
                                    <p className="text-white/40 text-sm">Notifikasi baru akan muncul di sini</p>
                                </div>
                            ) : (
                                // Grouped Notifications
                                <div className="pb-2">
                                    {groupedNotifications.map((group) => (
                                        <div key={group.title}>
                                            {/* Group Header */}
                                            <div className="sticky top-0 px-4 py-2 bg-[#1A1A2E] border-b border-white/10">
                                                <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                                                    {group.title}
                                                </span>
                                            </div>
                                            {/* Notifications in Group */}
                                            {group.notifications.map((notification, index) => {
                                                const time = formatTime(notification.createdAt);
                                                return (
                                                    <motion.div
                                                        key={notification._id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className={`group relative p-4 hover:bg-white/[0.03] cursor-pointer transition-all ${!notification.isRead ? 'bg-[#6C5DD3]/5' : ''
                                                        }`}
                                                    >
                                                        {/* Unread Indicator */}
                                                        {!notification.isRead && (
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#6C5DD3] to-[#00C2FF] rounded-r-full" />
                                                        )}
                                                        
                                                        <div className="flex gap-3">
                                                            {/* Avatar/Icon */}
                                                            {notification.type === 'new_episode' && notification.animePoster ? (
                                                                <div className="relative flex-shrink-0">
                                                                    <img
                                                                        src={notification.animePoster}
                                                                        alt={notification.animeTitle || ''}
                                                                        className="w-11 h-14 rounded-lg object-cover ring-1 ring-white/10"
                                                                        loading="lazy"
                                                                    />
                                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                                                        <Play className="w-2.5 h-2.5 text-white fill-current" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex-shrink-0">
                                                                    {getIcon(notification.type)}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0 pr-8">
                                                                <p className={`text-sm leading-relaxed line-clamp-2 ${!notification.isRead ? 'text-white font-medium' : 'text-white/70'
                                                                }`}>
                                                                    {notification.message}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    <span className="text-[11px] text-[#6C5DD3] font-medium">
                                                                        {time.label}
                                                                    </span>
                                                                    {!notification.isRead && (
                                                                        <span className="w-1.5 h-1.5 bg-[#6C5DD3] rounded-full" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Delete Button */}
                                                            <button
                                                                onClick={(e) => deleteNotification(e, notification._id)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-white/10 bg-white/[0.02]">
                                <button
                                    onClick={() => {
                                        navigate('/community');
                                        setIsOpen(false);
                                    }}
                                    className="w-full py-2.5 text-sm font-medium text-[#6C5DD3] hover:text-white bg-[#6C5DD3]/10 hover:bg-[#6C5DD3]/20 rounded-xl transition-all"
                                >
                                    Lihat semua di Komunitas
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
