import { useState, useEffect } from 'react';
import {
    Search,
    Users,
    ShieldCheck,
    ShieldOff,
    Ban,
    CheckCircle,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Filter,
    Award
} from 'lucide-react';
import { BACKEND_URL } from '@/config/api';

interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    isAdmin: boolean;
    isBanned: boolean;
    bannedReason?: string;
    createdAt: string;
    lastActive?: string;
    communityRole?: string;
}

interface Badge {
    _id: string;
    roleId: string;
    name: string;
    icon: string;
    bgColor: string;
    textColor: string;
    order: number;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [banReason, setBanReason] = useState('');
    const [showBanModal, setShowBanModal] = useState<string | null>(null);

    useEffect(() => {
        fetchBadges();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [page, filter]);

    const fetchBadges = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/badges`);
            if (res.ok) {
                const data = await res.json();
                setBadges(data);
            }
        } catch (err) {
            console.error('Failed to fetch badges:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                filter,
                search
            });
            const res = await fetch(`${BACKEND_URL}/api/admin/users?${params}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setUsers(data.users);
            setTotalPages(data.pagination.pages);
            setTotal(data.pagination.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const banUser = async (userId: string) => {
        try {
            setActionLoading(userId);
            const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/ban`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: banReason || 'Pelanggaran aturan' })
            });
            if (!res.ok) throw new Error('Failed to ban');
            const data = await res.json();
            setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
            setShowBanModal(null);
            setBanReason('');
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const unbanUser = async (userId: string) => {
        try {
            setActionLoading(userId);
            const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/unban`, {
                method: 'PUT'
            });
            if (!res.ok) throw new Error('Failed to unban');
            const data = await res.json();
            setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const promoteUser = async (userId: string) => {
        try {
            setActionLoading(userId);
            const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/promote`, {
                method: 'PUT'
            });
            if (!res.ok) throw new Error('Failed to promote');
            const data = await res.json();
            setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const demoteUser = async (userId: string) => {
        try {
            setActionLoading(userId);
            const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/demote`, {
                method: 'PUT'
            });
            if (!res.ok) throw new Error('Failed to demote');
            const data = await res.json();
            setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Yakin ingin menghapus user ini? Semua komentar user juga akan dihapus.')) return;

        try {
            setActionLoading(userId);
            const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');
            setUsers(prev => prev.filter(u => u._id !== userId));
            setTotal(prev => prev - 1);
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const updateBadge = async (userId: string, communityRole: string) => {
        try {
            setActionLoading(userId);
            const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/badge`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ communityRole })
            });
            if (!res.ok) throw new Error('Failed to update badge');
            const data = await res.json();
            setUsers(prev => prev.map(u => u._id === userId ? data.user : u));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const getBadgeColor = (role: string) => {
        const badge = badges.find(b => b.roleId === role);
        if (badge) {
            return `${badge.bgColor} ${badge.textColor}`;
        }
        // Fallback colors
        const colors: Record<string, string> = {
            member: 'bg-gray-500/20 text-gray-400',
            supporter: 'bg-green-500/20 text-green-400',
            knight: 'bg-blue-500/20 text-blue-400',
            guardian: 'bg-purple-500/20 text-purple-400',
            legend: 'bg-yellow-500/20 text-yellow-400',
            moderator: 'bg-cyan-500/20 text-cyan-400',
            admin: 'bg-red-500/20 text-red-400'
        };
        return colors[role] || colors.member;
    };

    return (
        <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama atau email..."
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                    />
                </form>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-white/50" />
                    <select
                        value={filter}
                        onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#6C5DD3]"
                    >
                        <option value="all" className="bg-[#1A1A2E]">Semua</option>
                        <option value="admin" className="bg-[#1A1A2E]">Admin</option>
                        <option value="banned" className="bg-[#1A1A2E]">Banned</option>
                        <option value="active" className="bg-[#1A1A2E]">Aktif</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#6C5DD3]" />
                <span className="text-white">Total: <strong>{total}</strong> users</span>
            </div>

            {/* Users List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#6C5DD3] animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">
                    {users.map((user) => (
                        <div
                            key={user._id}
                            className={`bg-white/5 border rounded-xl p-4 ${user.isBanned ? 'border-red-500/30' : 'border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center flex-shrink-0">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="text-white font-bold text-lg">{user.name?.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-white truncate">{user.name}</p>
                                        {user.isAdmin && (
                                            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">Admin</span>
                                        )}
                                        {user.isBanned && (
                                            <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">Banned</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-white/50 truncate">{user.email}</p>
                                    <p className="text-xs text-white/30 mt-1">
                                        Bergabung {new Date(user.createdAt).toLocaleDateString('id-ID')}
                                    </p>
                                    {user.isBanned && user.bannedReason && (
                                        <p className="text-xs text-red-400 mt-1">Alasan: {user.bannedReason}</p>
                                    )}
                                </div>

                                {/* Badge Selector */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Award className="w-4 h-4 text-white/50" />
                                    <select
                                        value={user.communityRole || 'member'}
                                        onChange={(e) => updateBadge(user._id, e.target.value)}
                                        disabled={actionLoading === user._id}
                                        className={`px-2 py-1 text-xs rounded-lg border border-white/10 focus:outline-none focus:border-[#6C5DD3] ${getBadgeColor(user.communityRole || 'member')}`}
                                    >
                                        {badges.map(badge => (
                                            <option key={badge.roleId} value={badge.roleId} className="bg-[#1A1A2E] text-white">
                                                {badge.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {actionLoading === user._id ? (
                                        <Loader2 className="w-5 h-5 text-[#6C5DD3] animate-spin" />
                                    ) : (
                                        <>
                                            {/* Admin Toggle */}
                                            {user.isAdmin ? (
                                                <button
                                                    onClick={() => demoteUser(user._id)}
                                                    className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                                                    title="Cabut Admin"
                                                >
                                                    <ShieldOff className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => promoteUser(user._id)}
                                                    className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                                                    title="Jadikan Admin"
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Ban Toggle */}
                                            {user.isBanned ? (
                                                <button
                                                    onClick={() => unbanUser(user._id)}
                                                    className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                                    title="Unban User"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setShowBanModal(user._id)}
                                                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                                    title="Ban User"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Delete */}
                                            <button
                                                onClick={() => deleteUser(user._id)}
                                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                                title="Hapus User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {users.length === 0 && (
                        <div className="text-center py-12 text-white/50">
                            Tidak ada user ditemukan
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 bg-white/5 rounded-lg text-white disabled:opacity-50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-white">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 bg-white/5 rounded-lg text-white disabled:opacity-50"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Ban Modal */}
            {showBanModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-white mb-4">Ban User</h3>
                        <input
                            type="text"
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="Alasan ban (opsional)"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3] mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowBanModal(null); setBanReason(''); }}
                                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => banUser(showBanModal)}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                Ban User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
