import { useState, useEffect } from 'react';
import {
    Award,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    Save,
    X,
    ChevronUp,
    ChevronDown,
    User,
    Heart,
    Shield,
    Crown,
    Star,
    ShieldCheck,
    Zap,
    Flame,
    Gem,
    Trophy,
    Medal,
    Sparkles
} from 'lucide-react';
import { BACKEND_URL } from '@/config/api';

interface Badge {
    _id: string;
    roleId: string;
    name: string;
    icon: string;
    bgColor: string;
    textColor: string;
    order: number;
    isSystem: boolean;
    isActive: boolean;
}

// Available icons for badges
const availableIcons = [
    { name: 'User', icon: User },
    { name: 'Heart', icon: Heart },
    { name: 'Shield', icon: Shield },
    { name: 'Crown', icon: Crown },
    { name: 'Star', icon: Star },
    { name: 'ShieldCheck', icon: ShieldCheck },
    { name: 'Award', icon: Award },
    { name: 'Zap', icon: Zap },
    { name: 'Flame', icon: Flame },
    { name: 'Gem', icon: Gem },
    { name: 'Trophy', icon: Trophy },
    { name: 'Medal', icon: Medal },
    { name: 'Sparkles', icon: Sparkles }
];

// Available colors for badges
const availableColors = [
    { name: 'Gray', bg: 'bg-gray-500/20', text: 'text-gray-400' },
    { name: 'Red', bg: 'bg-red-500/20', text: 'text-red-400' },
    { name: 'Orange', bg: 'bg-orange-500/20', text: 'text-orange-400' },
    { name: 'Yellow', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
    { name: 'Green', bg: 'bg-green-500/20', text: 'text-green-400' },
    { name: 'Teal', bg: 'bg-teal-500/20', text: 'text-teal-400' },
    { name: 'Cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    { name: 'Blue', bg: 'bg-blue-500/20', text: 'text-blue-400' },
    { name: 'Indigo', bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
    { name: 'Purple', bg: 'bg-purple-500/20', text: 'text-purple-400' },
    { name: 'Pink', bg: 'bg-pink-500/20', text: 'text-pink-400' },
    { name: 'Rose', bg: 'bg-rose-500/20', text: 'text-rose-400' }
];

export default function AdminBadges() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newBadge, setNewBadge] = useState({
        roleId: '',
        name: '',
        icon: 'Award',
        bgColor: 'bg-gray-500/20',
        textColor: 'text-gray-400'
    });

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${BACKEND_URL}/api/badges/all`);
            if (res.ok) {
                const data = await res.json();
                setBadges(data);
            }
        } catch (err) {
            console.error('Failed to fetch badges:', err);
        } finally {
            setLoading(false);
        }
    };

    const createBadge = async () => {
        if (!newBadge.roleId.trim() || !newBadge.name.trim()) return;

        try {
            setSaving(true);
            const res = await fetch(`${BACKEND_URL}/api/badges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newBadge,
                    order: badges.length
                })
            });
            if (res.ok) {
                const badge = await res.json();
                setBadges(prev => [...prev, badge]);
                setNewBadge({ roleId: '', name: '', icon: 'Award', bgColor: 'bg-gray-500/20', textColor: 'text-gray-400' });
                setIsCreating(false);
            }
        } catch (err) {
            console.error('Failed to create badge:', err);
        } finally {
            setSaving(false);
        }
    };

    const updateBadge = async () => {
        if (!editingBadge) return;

        try {
            setSaving(true);
            const res = await fetch(`${BACKEND_URL}/api/badges/${editingBadge._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingBadge.name,
                    icon: editingBadge.icon,
                    bgColor: editingBadge.bgColor,
                    textColor: editingBadge.textColor,
                    isActive: editingBadge.isActive
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setBadges(prev => prev.map(b => b._id === updated._id ? updated : b));
                setEditingBadge(null);
            }
        } catch (err) {
            console.error('Failed to update badge:', err);
        } finally {
            setSaving(false);
        }
    };

    const deleteBadge = async (badge: Badge) => {
        if (badge.isSystem) return;
        if (!confirm(`Hapus badge "${badge.name}"?`)) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/badges/${badge._id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setBadges(prev => prev.filter(b => b._id !== badge._id));
            }
        } catch (err) {
            console.error('Failed to delete badge:', err);
        }
    };

    const moveBadge = async (badge: Badge, direction: 'up' | 'down') => {
        const currentIndex = badges.findIndex(b => b._id === badge._id);
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= badges.length) return;

        const newBadges = [...badges];
        [newBadges[currentIndex], newBadges[newIndex]] = [newBadges[newIndex], newBadges[currentIndex]];

        // Update order values
        const orders = newBadges.map((b, i) => ({ id: b._id, order: i }));

        setBadges(newBadges);

        try {
            await fetch(`${BACKEND_URL}/api/badges/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders })
            });
        } catch (err) {
            console.error('Failed to reorder badges:', err);
        }
    };

    const getIconComponent = (iconName: string) => {
        const found = availableIcons.find(i => i.name === iconName);
        return found ? found.icon : Award;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#6C5DD3] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#6C5DD3]" />
                    <h3 className="text-lg font-bold text-white">Kelola Badge</h3>
                    <span className="text-white/50 text-sm">({badges.length} badges)</span>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5B4EC2] transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Badge
                </button>
            </div>

            {/* Create Badge Form */}
            {isCreating && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                    <h4 className="text-white font-medium">Badge Baru</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-white/70 text-sm">Role ID</label>
                            <input
                                type="text"
                                value={newBadge.roleId}
                                onChange={(e) => setNewBadge(prev => ({ ...prev, roleId: e.target.value }))}
                                placeholder="contoh: vip"
                                className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                            />
                        </div>
                        <div>
                            <label className="text-white/70 text-sm">Nama Badge</label>
                            <input
                                type="text"
                                value={newBadge.name}
                                onChange={(e) => setNewBadge(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="contoh: VIP Member"
                                className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-white/70 text-sm">Icon</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {availableIcons.map(({ name, icon: Icon }) => (
                                <button
                                    key={name}
                                    onClick={() => setNewBadge(prev => ({ ...prev, icon: name }))}
                                    className={`p-2 rounded-lg border transition-colors ${newBadge.icon === name
                                        ? 'bg-[#6C5DD3] border-[#6C5DD3]'
                                        : 'bg-white/5 border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <Icon className="w-5 h-5 text-white" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-white/70 text-sm">Warna</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {availableColors.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => setNewBadge(prev => ({ ...prev, bgColor: color.bg, textColor: color.text }))}
                                    className={`px-3 py-1 rounded-lg border transition-colors ${newBadge.bgColor === color.bg
                                        ? 'ring-2 ring-white'
                                        : ''
                                        } ${color.bg} ${color.text}`}
                                >
                                    {color.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-white/70 text-sm">Preview:</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${newBadge.bgColor} ${newBadge.textColor}`}>
                            {(() => { const Icon = getIconComponent(newBadge.icon); return <Icon className="w-3 h-3" />; })()}
                            {newBadge.name || 'Badge Name'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                        >
                            Batal
                        </button>
                        <button
                            onClick={createBadge}
                            disabled={saving || !newBadge.roleId.trim() || !newBadge.name.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5B4EC2] disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan
                        </button>
                    </div>
                </div>
            )}

            {/* Badge List */}
            <div className="space-y-3">
                {badges.map((badge, index) => (
                    <div
                        key={badge._id}
                        className={`bg-white/5 border ${badge.isActive ? 'border-white/10' : 'border-red-500/30 opacity-50'} rounded-xl p-4 flex items-center gap-4`}
                    >
                        {/* Order Controls */}
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => moveBadge(badge, 'up')}
                                disabled={index === 0}
                                className="p-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-30"
                            >
                                <ChevronUp className="w-4 h-4 text-white" />
                            </button>
                            <button
                                onClick={() => moveBadge(badge, 'down')}
                                disabled={index === badges.length - 1}
                                className="p-1 bg-white/5 rounded hover:bg-white/10 disabled:opacity-30"
                            >
                                <ChevronDown className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {/* Badge Preview */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${badge.bgColor} ${badge.textColor}`}>
                            {(() => { const Icon = getIconComponent(badge.icon); return <Icon className="w-4 h-4" />; })()}
                            <span className="text-sm font-medium">{badge.name}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white/50 text-sm">Role ID: <code className="text-white/70">{badge.roleId}</code></p>
                            {badge.isSystem && (
                                <span className="text-xs text-yellow-400">System Badge</span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setEditingBadge(badge)}
                                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            {!badge.isSystem && (
                                <button
                                    onClick={() => deleteBadge(badge)}
                                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingBadge && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Edit Badge</h3>
                            <button onClick={() => setEditingBadge(null)} className="p-1 hover:bg-white/10 rounded">
                                <X className="w-5 h-5 text-white/50" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-white/70 text-sm">Nama Badge</label>
                                <input
                                    type="text"
                                    value={editingBadge.name}
                                    onChange={(e) => setEditingBadge(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#6C5DD3]"
                                />
                            </div>
                            <div>
                                <label className="text-white/70 text-sm">Icon</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {availableIcons.map(({ name, icon: Icon }) => (
                                        <button
                                            key={name}
                                            onClick={() => setEditingBadge(prev => prev ? { ...prev, icon: name } : null)}
                                            className={`p-2 rounded-lg border transition-colors ${editingBadge.icon === name
                                                ? 'bg-[#6C5DD3] border-[#6C5DD3]'
                                                : 'bg-white/5 border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5 text-white" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-white/70 text-sm">Warna</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {availableColors.map(color => (
                                        <button
                                            key={color.name}
                                            onClick={() => setEditingBadge(prev => prev ? { ...prev, bgColor: color.bg, textColor: color.text } : null)}
                                            className={`px-3 py-1 rounded-lg border transition-colors ${editingBadge.bgColor === color.bg
                                                ? 'ring-2 ring-white'
                                                : ''
                                                } ${color.bg} ${color.text}`}
                                        >
                                            {color.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-white/70 text-sm">Status:</label>
                                <button
                                    onClick={() => setEditingBadge(prev => prev ? { ...prev, isActive: !prev.isActive } : null)}
                                    className={`px-3 py-1 rounded-full text-sm ${editingBadge.isActive
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                        }`}
                                >
                                    {editingBadge.isActive ? 'Aktif' : 'Nonaktif'}
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/70 text-sm">Preview:</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${editingBadge.bgColor} ${editingBadge.textColor}`}>
                                    {(() => { const Icon = getIconComponent(editingBadge.icon); return <Icon className="w-3 h-3" />; })()}
                                    {editingBadge.name}
                                </span>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    onClick={() => setEditingBadge(null)}
                                    className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={updateBadge}
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#6C5DD3] text-white rounded-lg hover:bg-[#5B4EC2] disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
