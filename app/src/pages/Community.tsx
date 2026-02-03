import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, MessageCircle, Heart, TrendingUp, Star, Plus, Clock, Pin, Lock, Send, Edit3, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import AnimeCard from '@/components/AnimeCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BACKEND_URL } from '@/config/api';
import RoleBadge from '@/components/RoleBadge';
import { getAuthHeaders } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import SafeAvatar from '@/components/SafeAvatar';

interface Discussion {
    _id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    userRole?: string;
    title: string;
    content: string;
    category: string;
    animeId?: string;
    animeTitle?: string;
    animePoster?: string;
    replyCount: number;
    likes: string[];
    isPinned: boolean;
    isLocked: boolean;
    createdAt: string;
}

export default function Community() {
    const { animeList, user } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'trending' | 'discussions' | 'reviews'>('discussions');
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '', category: 'general' });
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Toast notification state
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'error' | 'success' }>({ show: false, message: '', type: 'error' });

    // Edit state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null);
    const [editForm, setEditForm] = useState({ title: '', content: '', category: '' });

    // Review state
    interface Review {
        _id: string;
        userId: string;
        userName: string;
        userAvatar: string;
        userRole?: string;
        animeId: string;
        animeTitle: string;
        animePoster: string;
        rating: number;
        title: string;
        content: string;
        likes: string[];
        helpful: string[];
        createdAt: string;
    }
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false);
    const [newReview, setNewReview] = useState({ animeId: '', rating: 8, title: '', content: '' });
    const [reviewSort, setReviewSort] = useState('latest');
    const [animeSearch, setAnimeSearch] = useState('');

    // Get some anime for trending display
    const trendingAnime = [...animeList].sort((a, b) => b.rating - a.rating).slice(0, 6);

    const tabs = [
        { id: 'trending', label: 'Trending', icon: TrendingUp },
        { id: 'discussions', label: 'Diskusi', icon: MessageCircle },
        { id: 'reviews', label: 'Review', icon: Star },
    ];

    const categories = [
        { id: 'all', label: 'Semua' },
        { id: 'info', label: 'Informasi' },
        { id: 'general', label: 'Umum' },
        { id: 'anime', label: 'Anime' },
        { id: 'recommendation', label: 'Rekomendasi' },
        { id: 'question', label: 'Pertanyaan' },
    ];

    // Fetch discussions
    useEffect(() => {
        const fetchDiscussions = async () => {
            try {
                setLoading(true);
                const url = selectedCategory === 'all'
                    ? `${BACKEND_URL}/api/discussions`
                    : `${BACKEND_URL}/api/discussions?category=${selectedCategory}`;
                const res = await apiFetch(url);
                const data = await res.json();
                setDiscussions(data.discussions || []);
            } catch (err) {
                console.error('Failed to fetch discussions:', err);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'discussions') {
            fetchDiscussions();
        }
    }, [activeTab, selectedCategory]);

    // Fetch reviews
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setReviewsLoading(true);
                const res = await apiFetch(`${BACKEND_URL}/api/reviews?sort=${reviewSort}&limit=20`);
                const data = await res.json();
                setReviews(data.reviews || []);
            } catch (err) {
                console.error('Failed to fetch reviews:', err);
            } finally {
                setReviewsLoading(false);
            }
        };

        if (activeTab === 'reviews') {
            fetchReviews();
        }
    }, [activeTab, reviewSort]);

    // Create new discussion
    const handleCreateDiscussion = async () => {
        if (!user || !newDiscussion.title.trim() || !newDiscussion.content.trim()) return;

        try {
            const res = await apiFetch(`${BACKEND_URL}/api/discussions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    userId: user.id,
                    userName: user.name,
                    userAvatar: user.avatar || '',
                    title: newDiscussion.title,
                    content: newDiscussion.content,
                    category: newDiscussion.category
                })
            });

            if (res.ok) {
                const created = await res.json();
                setDiscussions(prev => [created, ...prev]);
                setNewDiscussion({ title: '', content: '', category: 'general' });
                setIsCreateOpen(false);
            } else {
                const err = await res.json();
                setToast({ show: true, message: err.error || 'Gagal membuat diskusi', type: 'error' });
                setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
            }
        } catch (err) {
            console.error('Failed to create discussion:', err);
            setToast({ show: true, message: 'Terjadi kesalahan, coba lagi', type: 'error' });
            setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
        }
    };

    // Toggle like
    const handleLike = async (discussionId: string) => {
        if (!user) return;

        try {
            const res = await apiFetch(`${BACKEND_URL}/api/discussions/${discussionId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ userId: user.id, userName: user.name })
            });

            if (res.ok) {
                const data = await res.json();
                setDiscussions(prev => prev.map(d =>
                    d._id === discussionId
                        ? { ...d, likes: data.isLiked ? [...d.likes, user.id] : d.likes.filter(id => id !== user.id) }
                        : d
                ));
            }
        } catch (err) {
            console.error('Failed to like:', err);
        }
    };

    // Toggle pin (admin only)
    const handlePin = async (e: React.MouseEvent, discussionId: string) => {
        e.stopPropagation(); // Prevent navigation to detail page
        if (!user?.isAdmin) return;

        try {
            const res = await apiFetch(`${BACKEND_URL}/api/discussions/${discussionId}/pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ isAdmin: user.isAdmin })
            });

            if (res.ok) {
                const data = await res.json();
                setDiscussions(prev => {
                    const updated = prev.map(d =>
                        d._id === discussionId ? { ...d, isPinned: data.isPinned } : d
                    );
                    // Re-sort: pinned first
                    return updated.sort((a, b) => {
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    });
                });
            }
        } catch (err) {
            console.error('Failed to pin:', err);
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'Baru saja';
        if (hours < 24) return `${hours} jam lalu`;
        if (days < 7) return `${days} hari lalu`;
        return date.toLocaleDateString('id-ID');
    };

    // Get category label
    const getCategoryLabel = (cat: string) => {
        const found = categories.find(c => c.id === cat);
        return found?.label || cat;
    };

    // Get category color
    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'info': return 'bg-cyan-500/20 text-cyan-400';
            case 'anime': return 'bg-purple-500/20 text-purple-400';
            case 'recommendation': return 'bg-green-500/20 text-green-400';
            case 'question': return 'bg-blue-500/20 text-blue-400';
            default: return 'bg-white/10 text-white/60';
        }
    };

    // Open edit dialog
    const openEditDialog = (e: React.MouseEvent, discussion: Discussion) => {
        e.stopPropagation();
        setEditingDiscussion(discussion);
        setEditForm({
            title: discussion.title,
            content: discussion.content,
            category: discussion.category
        });
        setIsEditOpen(true);
    };

    // Save edit
    const handleSaveEdit = async () => {
        if (!user || !editingDiscussion || !editForm.title.trim() || !editForm.content.trim()) return;

        try {
            const res = await apiFetch(`${BACKEND_URL}/api/discussions/${editingDiscussion._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    userId: user.id,
                    title: editForm.title,
                    content: editForm.content,
                    category: editForm.category
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setDiscussions(prev => prev.map(d =>
                    d._id === editingDiscussion._id ? { ...d, ...updated } : d
                ));
                setIsEditOpen(false);
                setEditingDiscussion(null);
            }
        } catch (err) {
            console.error('Failed to edit discussion:', err);
        }
    };

    // Create new review
    const handleCreateReview = async () => {
        if (!user || !newReview.animeId || !newReview.title.trim() || !newReview.content.trim()) return;

        const selectedAnime = animeList.find(a => a.id === newReview.animeId);
        if (!selectedAnime) return;

        try {
            const res = await apiFetch(`${BACKEND_URL}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    userId: user.id,
                    userName: user.name,
                    userAvatar: user.avatar || '',
                    animeId: selectedAnime.id,
                    animeTitle: selectedAnime.title,
                    animePoster: selectedAnime.poster,
                    rating: newReview.rating,
                    title: newReview.title,
                    content: newReview.content
                })
            });

            if (res.ok) {
                const created = await res.json();
                setReviews(prev => [created, ...prev]);
                setNewReview({ animeId: '', rating: 8, title: '', content: '' });
                setIsCreateReviewOpen(false);
            } else {
                const err = await res.json();
                setToast({ show: true, message: err.error || 'Gagal membuat review', type: 'error' });
                setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
            }
        } catch (err) {
            console.error('Failed to create review:', err);
            setToast({ show: true, message: 'Terjadi kesalahan, coba lagi', type: 'error' });
            setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
        }
    };

    // Like review
    const handleLikeReview = async (reviewId: string) => {
        if (!user) return;

        try {
            const res = await apiFetch(`${BACKEND_URL}/api/reviews/${reviewId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ userId: user.id })
            });

            if (res.ok) {
                const data = await res.json();
                setReviews(prev => prev.map(r =>
                    r._id === reviewId
                        ? { ...r, likes: data.isLiked ? [...r.likes, user.id] : r.likes.filter(id => id !== user.id) }
                        : r
                ));
            }
        } catch (err) {
            console.error('Failed to like review:', err);
        }
    };

    // Mark review as helpful
    const handleHelpfulReview = async (reviewId: string) => {
        if (!user) return;

        try {
            const res = await apiFetch(`${BACKEND_URL}/api/reviews/${reviewId}/helpful`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ userId: user.id })
            });

            if (res.ok) {
                const data = await res.json();
                setReviews(prev => prev.map(r =>
                    r._id === reviewId
                        ? { ...r, helpful: data.isHelpful ? [...r.helpful, user.id] : r.helpful.filter(id => id !== user.id) }
                        : r
                ));
            }
        } catch (err) {
            console.error('Failed to mark review as helpful:', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F0F1A] pt-24 pb-12">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className={`fixed top-20 left-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-xl ${toast.type === 'error'
                            ? 'bg-red-500/20 border-red-500/30'
                            : 'bg-green-500/20 border-green-500/30'
                            }`}
                    >
                        <AlertCircle className={`w-5 h-5 flex-shrink-0 ${toast.type === 'error' ? 'text-red-400' : 'text-green-400'}`} />
                        <span className="text-white font-medium text-sm">{toast.message}</span>
                        <button
                            onClick={() => setToast(prev => ({ ...prev, show: false }))}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-2"
                        >
                            <X className="w-4 h-4 text-white/60" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] mb-6 shadow-xl shadow-[#6C5DD3]/30">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Komunitas Anime</h1>
                    <p className="text-white/50 max-w-2xl mx-auto">
                        Bergabung dengan penggemar anime lainnya. Diskusi, review, dan berbagi rekomendasi anime favoritmu!
                    </p>
                </motion.div>

                {/* Tabs */}
                <div className="flex justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 px-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] text-white shadow-lg shadow-[#6C5DD3]/30'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden xs:inline sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'trending' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {trendingAnime.map((anime, index) => (
                                    <AnimeCard key={anime.id} anime={anime} index={index} />
                                ))}
                            </div>
                        )}

                        {activeTab === 'discussions' && (
                            <div className="max-w-4xl mx-auto">
                                {/* Header with Create Button */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                                    {/* Category Filter */}
                                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === cat.id
                                                    ? 'bg-[#6C5DD3] text-white'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                    }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Create Button */}
                                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                className="bg-[#6C5DD3] hover:bg-[#5a4ec0] gap-2 w-full sm:w-auto"
                                                disabled={!user}
                                            >
                                                <Plus className="w-4 h-4" />
                                                Buat Diskusi
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-[#1A1A2E] border-white/10 max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle className="text-white">Buat Diskusi Baru</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 mt-4">
                                                <div>
                                                    <label className="text-white/70 text-sm">Judul</label>
                                                    <input
                                                        type="text"
                                                        value={newDiscussion.title}
                                                        onChange={(e) => setNewDiscussion(prev => ({ ...prev, title: e.target.value }))}
                                                        placeholder="Tulis judul diskusi..."
                                                        className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                                                        maxLength={200}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-white/70 text-sm">Kategori</label>
                                                    <select
                                                        value={newDiscussion.category}
                                                        onChange={(e) => setNewDiscussion(prev => ({ ...prev, category: e.target.value }))}
                                                        className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#6C5DD3]"
                                                    >
                                                        {categories.filter(c => c.id !== 'all').map(cat => (
                                                            <option key={cat.id} value={cat.id} className="bg-[#1A1A2E]">
                                                                {cat.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-white/70 text-sm">Konten</label>
                                                    <textarea
                                                        value={newDiscussion.content}
                                                        onChange={(e) => setNewDiscussion(prev => ({ ...prev, content: e.target.value }))}
                                                        placeholder="Tulis isi diskusi..."
                                                        rows={5}
                                                        className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3] resize-none"
                                                        maxLength={5000}
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleCreateDiscussion}
                                                    className="w-full bg-[#6C5DD3] hover:bg-[#5a4ec0]"
                                                    disabled={!newDiscussion.title.trim() || !newDiscussion.content.trim()}
                                                >
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Posting Diskusi
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* Discussion List */}
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-4 sm:p-5 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 animate-pulse">
                                                <div className="flex items-start gap-2 sm:gap-3 mb-3">
                                                    <SafeAvatar
                                                        loading
                                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                                                        skeletonClassName="bg-white/10"
                                                    />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 bg-white/10 rounded w-3/5" />
                                                        <div className="h-3 bg-white/10 rounded w-2/5" />
                                                    </div>
                                                </div>
                                                <div className="h-4 bg-white/10 rounded w-5/6 mb-2" />
                                                <div className="h-4 bg-white/10 rounded w-2/3" />
                                            </div>
                                        ))}
                                    </div>
                                ) : discussions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                        <p className="text-white/50">Belum ada diskusi. Jadilah yang pertama!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {discussions.map((discussion, index) => (
                                            <motion.div
                                                key={discussion._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="p-4 sm:p-5 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 hover:border-[#6C5DD3]/50 transition-all cursor-pointer group"
                                                onClick={() => navigate(`/community/discussion/${discussion._id}`)}
                                            >
                                                {/* Header */}
                                                <div className="flex items-start gap-2 sm:gap-3 mb-3">
                                                    <SafeAvatar
                                                        src={discussion.userAvatar}
                                                        name={discussion.userName}
                                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 text-sm sm:text-base"
                                                        fallbackClassName="text-sm sm:text-base"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                            {discussion.isPinned && (
                                                                <Pin className="w-3 h-3 text-yellow-400" />
                                                            )}
                                                            {discussion.isLocked && (
                                                                <Lock className="w-3 h-3 text-red-400" />
                                                            )}
                                                            <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-[#6C5DD3] transition-colors line-clamp-2 sm:line-clamp-1">
                                                                {discussion.title}
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white/50 flex-wrap mt-1">
                                                            <span className="truncate max-w-[100px] sm:max-w-none">@{discussion.userName}</span>
                                                            {discussion.userRole && <RoleBadge role={discussion.userRole} />}
                                                            <span className="hidden sm:inline">•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDate(discussion.createdAt)}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(discussion.category)}`}>
                                                                {getCategoryLabel(discussion.category)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content Preview */}
                                                <p className="text-white/70 text-sm sm:text-base line-clamp-2 mb-3">
                                                    {discussion.content}
                                                </p>

                                                {/* Footer */}
                                                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/50">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleLike(discussion._id);
                                                        }}
                                                        className={`flex items-center gap-1 hover:text-red-400 transition-colors ${user && discussion.likes.includes(user.id) ? 'text-red-400' : ''
                                                            }`}
                                                    >
                                                        <Heart className={`w-4 h-4 ${user && discussion.likes.includes(user.id) ? 'fill-current' : ''}`} />
                                                        {discussion.likes.length}
                                                    </button>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="w-4 h-4" />
                                                        <span className="hidden sm:inline">{discussion.replyCount} balasan</span>
                                                        <span className="sm:hidden">{discussion.replyCount}</span>
                                                    </span>

                                                    {/* Edit Button (Owner only) */}
                                                    {user && user.id === discussion.userId && (
                                                        <button
                                                            onClick={(e) => openEditDialog(e, discussion)}
                                                            className="flex items-center gap-1 hover:text-[#6C5DD3] transition-colors ml-auto"
                                                            title="Edit diskusi"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Edit</span>
                                                        </button>
                                                    )}

                                                    {/* Pin Button (Admin only) */}
                                                    {user?.isAdmin && (
                                                        <button
                                                            onClick={(e) => handlePin(e, discussion._id)}
                                                            className={`flex items-center gap-1 ${user.id !== discussion.userId ? 'ml-auto' : ''} transition-colors ${discussion.isPinned
                                                                ? 'text-yellow-400 hover:text-yellow-300'
                                                                : 'hover:text-yellow-400'}`}
                                                            title={discussion.isPinned ? 'Lepas pin' : 'Pin diskusi'}
                                                        >
                                                            <Pin className={`w-4 h-4 ${discussion.isPinned ? 'fill-current' : ''}`} />
                                                            <span className="hidden sm:inline">{discussion.isPinned ? 'Pinned' : 'Pin'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {!user && (
                                    <div className="text-center mt-6 p-4 bg-white/5 rounded-xl">
                                        <p className="text-white/50 text-sm">
                                            <Link to="/login" className="text-[#6C5DD3] hover:underline">Login</Link> untuk membuat diskusi baru
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="max-w-4xl mx-auto">
                                {/* Reviews Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={reviewSort}
                                            onChange={(e) => setReviewSort(e.target.value)}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#6C5DD3]"
                                        >
                                            <option value="latest" className="bg-[#1A1A2E]">Terbaru</option>
                                            <option value="rating" className="bg-[#1A1A2E]">Rating Tertinggi</option>
                                            <option value="helpful" className="bg-[#1A1A2E]">Paling Helpful</option>
                                            <option value="likes" className="bg-[#1A1A2E]">Paling Disukai</option>
                                        </select>
                                    </div>

                                    {user && (
                                        <Dialog open={isCreateReviewOpen} onOpenChange={setIsCreateReviewOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="bg-[#6C5DD3] hover:bg-[#5a4ec0] gap-2">
                                                    <Plus className="w-4 h-4" />
                                                    Tulis Review
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-[#1A1A2E] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle className="text-white">Tulis Review Anime</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 mt-4">
                                                    <div>
                                                        <label className="text-white/70 text-sm">Pilih Anime</label>
                                                        <input
                                                            type="text"
                                                            value={animeSearch}
                                                            onChange={(e) => {
                                                                setAnimeSearch(e.target.value);
                                                                if (newReview.animeId) setNewReview(prev => ({ ...prev, animeId: '' }));
                                                            }}
                                                            placeholder="Cari anime..."
                                                            className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                                                        />
                                                        {animeSearch && !newReview.animeId && (
                                                            <div className="mt-2 max-h-40 overflow-y-auto bg-[#1A1A2E] border border-white/10 rounded-xl">
                                                                {animeList
                                                                    .filter(anime => anime.title.toLowerCase().includes(animeSearch.toLowerCase()))
                                                                    .slice(0, 10)
                                                                    .map(anime => (
                                                                        <button
                                                                            key={anime.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setNewReview(prev => ({ ...prev, animeId: anime.id }));
                                                                                setAnimeSearch(anime.title);
                                                                            }}
                                                                            className="w-full px-4 py-2 text-left text-white hover:bg-[#6C5DD3]/20 transition-colors flex items-center gap-3"
                                                                        >
                                                                            {anime.poster && (
                                                                                <img
                                                                                    src={anime.poster}
                                                                                    alt=""
                                                                                    className="w-8 h-12 object-cover rounded"
                                                                                    loading="lazy"
                                                                                />
                                                                            )}
                                                                            <span className="truncate">{anime.title}</span>
                                                                        </button>
                                                                    ))}
                                                                {animeList.filter(anime => anime.title.toLowerCase().includes(animeSearch.toLowerCase())).length === 0 && (
                                                                    <div className="px-4 py-3 text-white/50 text-sm">Tidak ditemukan</div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {newReview.animeId && (
                                                            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-[#6C5DD3]/20 rounded-lg">
                                                                <span className="text-[#6C5DD3] text-sm">✓ {animeSearch}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewReview(prev => ({ ...prev, animeId: '' }));
                                                                        setAnimeSearch('');
                                                                    }}
                                                                    className="ml-auto text-white/50 hover:text-white text-xs"
                                                                >
                                                                    Ganti
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="text-white/70 text-sm">Rating (1-10)</label>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="flex">
                                                                {Array.from({ length: 10 }, (_, i) => (
                                                                    <button
                                                                        key={i}
                                                                        type="button"
                                                                        onClick={() => setNewReview(prev => ({ ...prev, rating: i + 1 }))}
                                                                        className="p-0.5 hover:scale-110 transition-transform"
                                                                    >
                                                                        <Star
                                                                            className={`w-6 h-6 transition-colors ${i < newReview.rating
                                                                                ? 'text-yellow-400 fill-yellow-400'
                                                                                : 'text-white/20 hover:text-yellow-400/50'}`}
                                                                        />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <span className="text-2xl font-bold text-yellow-400 ml-2">{newReview.rating}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-white/70 text-sm">Judul Review</label>
                                                        <input
                                                            type="text"
                                                            value={newReview.title}
                                                            onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                                                            placeholder="Contoh: Anime terbaik tahun ini!"
                                                            className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3]"
                                                            maxLength={200}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-white/70 text-sm">Review</label>
                                                        <textarea
                                                            value={newReview.content}
                                                            onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                                                            placeholder="Tulis pendapat kamu tentang anime ini..."
                                                            rows={5}
                                                            className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3] resize-none"
                                                            maxLength={5000}
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={handleCreateReview}
                                                        disabled={!newReview.animeId || !newReview.title.trim() || !newReview.content.trim()}
                                                        className="w-full bg-[#6C5DD3] hover:bg-[#5a4ec0] gap-2"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                        Kirim Review
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>

                                {/* Reviews List */}
                                {reviewsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-8 h-8 border-2 border-[#6C5DD3] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Star className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                        <p className="text-white/50">Belum ada review. Jadilah yang pertama!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reviews.map((review, index) => (
                                            <motion.div
                                                key={review._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="p-4 sm:p-5 bg-white/5 rounded-xl border border-white/10 hover:border-[#6C5DD3]/50 transition-all"
                                            >
                                                <div className="flex gap-4">
                                                    {/* Anime Poster */}
                                                    {review.animePoster && (
                                                        <Link to={`/anime/${review.animeId}`} className="flex-shrink-0 hidden sm:block">
                                                            <img
                                                                src={review.animePoster}
                                                                alt={review.animeTitle}
                                                                className="w-20 h-28 object-cover rounded-lg"
                                                                loading="lazy"
                                                            />
                                                        </Link>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        {/* Header */}
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div>
                                                                <Link
                                                                    to={`/anime/${review.animeId}`}
                                                                    className="text-[#6C5DD3] text-sm hover:underline"
                                                                >
                                                                    {review.animeTitle}
                                                                </Link>
                                                                <h3 className="text-white font-semibold line-clamp-1">{review.title}</h3>
                                                            </div>
                                                            <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg flex-shrink-0">
                                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                                <span className="text-yellow-400 font-bold">{review.rating}</span>
                                                            </div>
                                                        </div>

                                                        {/* Content */}
                                                        <p className="text-white/70 text-sm line-clamp-3 mb-3">
                                                            {review.content}
                                                        </p>

                                                        {/* Footer */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <SafeAvatar
                                                                    src={review.userAvatar}
                                                                    name={review.userName}
                                                                    className="w-6 h-6 rounded-full"
                                                                    fallbackClassName="text-xs"
                                                                />
                                                                <span className="text-white/60 text-sm">{review.userName}</span>
                                                                <span className="text-white/30 text-xs">•</span>
                                                                <span className="text-white/40 text-xs">{formatDate(review.createdAt)}</span>
                                                            </div>

                                                            <div className="flex items-center gap-3 text-white/50 text-sm">
                                                                <button
                                                                    onClick={() => handleLikeReview(review._id)}
                                                                    className={`flex items-center gap-1 transition-colors ${user && review.likes.includes(user.id) ? 'text-red-400' : 'hover:text-red-400'}`}
                                                                    disabled={!user}
                                                                >
                                                                    <Heart className={`w-4 h-4 ${user && review.likes.includes(user.id) ? 'fill-current' : ''}`} />
                                                                    {review.likes.length}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleHelpfulReview(review._id)}
                                                                    className={`flex items-center gap-1 transition-colors ${user && review.helpful.includes(user.id) ? 'text-green-400' : 'hover:text-green-400'}`}
                                                                    disabled={!user}
                                                                >
                                                                    <span>👍</span>
                                                                    {review.helpful.length}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {!user && (
                                    <div className="text-center mt-6 p-4 bg-white/5 rounded-xl">
                                        <p className="text-white/50 text-sm">
                                            <Link to="/login" className="text-[#6C5DD3] hover:underline">Login</Link> untuk menulis review
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* CTA */}
                {!user && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-16 text-center p-8 bg-gradient-to-r from-[#6C5DD3]/20 to-[#00C2FF]/20 rounded-3xl border border-white/10"
                    >
                        <h3 className="text-xl font-bold text-white mb-2">Ingin bergabung dengan komunitas?</h3>
                        <p className="text-white/50 mb-6">Daftar sekarang untuk mulai berdiskusi dan berbagi review!</p>
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            <Users className="w-5 h-5" />
                            Gabung Sekarang
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Edit Discussion Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-[#1A1A2E] border-white/10 max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit Diskusi</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Judul</label>
                            <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C5DD3]"
                                placeholder="Judul diskusi"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Kategori</label>
                            <select
                                value={editForm.category}
                                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#6C5DD3]"
                            >
                                {categories.filter(c => c.id !== 'all').map(cat => (
                                    <option key={cat.id} value={cat.id} className="bg-[#1A1A2E]">
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Konten</label>
                            <textarea
                                value={editForm.content}
                                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                rows={5}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C5DD3] resize-none"
                                placeholder="Tulis konten diskusi..."
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                                className="border-white/10 text-white/60 hover:bg-white/5"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                disabled={!editForm.title.trim() || !editForm.content.trim()}
                                className="bg-[#6C5DD3] hover:bg-[#5a4ec0]"
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Simpan
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
