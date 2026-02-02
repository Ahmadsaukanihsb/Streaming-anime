import { useState, useEffect } from 'react';
import {
    Users,
    Film,
    PlaySquare,
    MessageSquare,
    Eye,
    ShieldCheck,
    Ban,
    TrendingUp,
    Star,
    Loader2
} from 'lucide-react';
import { BACKEND_URL } from '@/config/api';

interface StatsData {
    totals: {
        users: number;
        anime: number;
        episodes: number;
        comments: number;
        views: number;
        admins: number;
        banned: number;
    };
    weekly: {
        newUsers: number;
        newComments: number;
    };
    topAnime: any[];
    recentUsers: any[];
    recentActivity: {
        _id: string;
        type: string;
        description: string;
        itemTitle: string;
        userName: string;
        createdAt: string;
    }[];
}

export default function AdminStats() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BACKEND_URL}/api/admin/stats`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#6C5DD3] animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={fetchStats}
                    className="mt-4 px-4 py-2 bg-[#6C5DD3] rounded-lg text-white"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        { label: 'Total Users', value: stats.totals.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/20' },
        { label: 'Total Anime', value: stats.totals.anime, icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/20' },
        { label: 'Total Episode', value: stats.totals.episodes, icon: PlaySquare, color: 'text-green-400', bg: 'bg-green-500/20' },
        { label: 'Total Komentar', value: stats.totals.comments, icon: MessageSquare, color: 'text-orange-400', bg: 'bg-orange-500/20' },
        { label: 'Total Views', value: stats.totals.views.toLocaleString(), icon: Eye, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
        { label: 'Admin', value: stats.totals.admins, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
        { label: 'Banned', value: stats.totals.banned, icon: Ban, color: 'text-red-400', bg: 'bg-red-500/20' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">{stat.label}</p>
                                <p className="text-xl font-bold text-white">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Weekly Stats */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#6C5DD3]" />
                    Statistik Mingguan
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/50 text-sm">User Baru (7 hari)</p>
                        <p className="text-2xl font-bold text-green-400">+{stats.weekly.newUsers}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-white/50 text-sm">Komentar Baru (7 hari)</p>
                        <p className="text-2xl font-bold text-blue-400">+{stats.weekly.newComments}</p>
                    </div>
                </div>
            </div>

            {/* Top Anime */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    Top 5 Anime (Views)
                </h3>
                <div className="space-y-3">
                    {stats.topAnime.map((anime, idx) => (
                        <div key={anime.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                            <span className="text-lg font-bold text-[#6C5DD3] w-6">#{idx + 1}</span>
                            <img
                                src={anime.poster}
                                alt={anime.title}
                                className="w-10 h-14 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{anime.title}</p>
                                <div className="flex items-center gap-2 text-sm text-white/50">
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        {(anime.views || 0).toLocaleString()}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400" />
                                        {anime.rating?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {stats.topAnime.length === 0 && (
                        <p className="text-white/50 text-center py-4">Belum ada data</p>
                    )}
                </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    User Terbaru
                </h3>
                <div className="space-y-2">
                    {stats.recentUsers.map((user) => (
                        <div key={user._id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{user.name}</p>
                                <p className="text-sm text-white/50 truncate">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {user.isAdmin && (
                                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">Admin</span>
                                )}
                                {user.isBanned && (
                                    <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">Banned</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Aktivitas Terbaru
                </h3>
                <div className="space-y-2">
                    {stats.recentActivity?.length > 0 ? (
                        stats.recentActivity.map((activity) => {
                            const timeAgo = getTimeAgo(activity.createdAt);
                            const icon = getActivityIcon(activity.type);
                            return (
                                <div key={activity._id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                    <div className={`p-2 rounded-lg ${icon.bg}`}>
                                        {icon.element}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white">
                                            {activity.description}: <span className="font-medium">{activity.itemTitle}</span>
                                        </p>
                                        <p className="text-xs text-white/50">{timeAgo} • oleh {activity.userName}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-white/50 text-center py-4">Belum ada aktivitas</p>
                    )}
                </div>
            </div>
        </div>
    );

    function getTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        return `${diffDays} hari lalu`;
    }

    function getActivityIcon(type: string) {
        switch (type) {
            case 'anime_added':
                return { element: <Film className="w-4 h-4 text-purple-400" />, bg: 'bg-purple-500/20' };
            case 'episode_added':
                return { element: <PlaySquare className="w-4 h-4 text-blue-400" />, bg: 'bg-blue-500/20' };
            case 'user_registered':
                return { element: <Users className="w-4 h-4 text-green-400" />, bg: 'bg-green-500/20' };
            case 'comment_added':
                return { element: <MessageSquare className="w-4 h-4 text-orange-400" />, bg: 'bg-orange-500/20' };
            default:
                return { element: <TrendingUp className="w-4 h-4 text-cyan-400" />, bg: 'bg-cyan-500/20' };
        }
    }
}
