import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, Check, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { BACKEND_URL } from '@/config/api';

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
                const res = await fetch(`${BACKEND_URL}/api/notifications/unread-count?userId=${user.id}`);
                const data = await res.json();
                setUnreadCount(data.count || 0);
            } catch (err) {
                console.error('Failed to fetch unread count:', err);
            }
        };

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [user]);

    // Fetch notifications when opening dropdown
    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${BACKEND_URL}/api/notifications?userId=${user.id}&limit=10`);
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
            await fetch(`${BACKEND_URL}/api/notifications/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification: NotificationItem) => {
        if (notification.type === 'new_episode' && notification.animeId) {
            navigate(`/anime/${notification.animeId}`);
            setIsOpen(false);
        } else if (notification.discussionId) {
            navigate(`/community/discussion/${notification.discussionId}`);
            setIsOpen(false);
        }
    };

    // Get icon for notification type
    const getIcon = (type: string) => {
        switch (type) {
            case 'like_discussion':
            case 'like_reply':
                return <Heart className="w-4 h-4 text-red-400 fill-current" />;
            case 'reply':
                return <MessageCircle className="w-4 h-4 text-blue-400" />;
            case 'new_episode':
                return <Play className="w-4 h-4 text-green-400 fill-current" />;
            default:
                return <Bell className="w-4 h-4 text-white/50" />;
        }
    };

    // Format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Baru saja';
        if (minutes < 60) return `${minutes} menit`;
        if (hours < 24) return `${hours} jam`;
        return `${days} hari`;
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-[#1A1A2E] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-white font-semibold">Notifikasi</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-[#6C5DD3] hover:underline flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" />
                                        Tandai dibaca
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 text-white/40 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-80 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-[#6C5DD3] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                    <p className="text-white/40 text-sm">Belum ada notifikasi</p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!notification.isRead ? 'bg-[#6C5DD3]/10' : ''
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                {notification.type === 'new_episode' && notification.animePoster ? (
                                                    <img
                                                        src={notification.animePoster}
                                                        alt={notification.animeTitle || ''}
                                                        className="w-10 h-14 rounded-lg object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white/80 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-white/40 mt-1">
                                                        {formatTime(notification.createdAt)}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-[#6C5DD3] rounded-full flex-shrink-0 mt-2" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-white/10 text-center">
                                <button
                                    onClick={() => {
                                        navigate('/community');
                                        setIsOpen(false);
                                    }}
                                    className="text-sm text-[#6C5DD3] hover:underline"
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
