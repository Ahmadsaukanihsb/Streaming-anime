import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Clock, Send, Trash2, Pin, Lock, Reply, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { BACKEND_URL } from '@/config/api';
import RoleBadge from '@/components/RoleBadge';

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

interface Reply {
    _id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    userRole?: string;
    content: string;
    likes: string[];
    parentReplyId?: string;
    createdAt: string;
}

export default function DiscussionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useApp();

    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyTo, setReplyTo] = useState<{ id: string; userName: string } | null>(null);
    const replyInputRef = useRef<HTMLTextAreaElement>(null);

    // Toast notification state
    const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    // Fetch discussion and replies
    useEffect(() => {
        const fetchDiscussion = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const res = await fetch(`${BACKEND_URL}/api/discussions/${id}`);
                if (!res.ok) {
                    navigate('/community');
                    return;
                }
                const data = await res.json();
                setDiscussion(data.discussion);
                setReplies(data.replies || []);
            } catch (err) {
                console.error('Failed to fetch discussion:', err);
                navigate('/community');
            } finally {
                setLoading(false);
            }
        };

        fetchDiscussion();
    }, [id, navigate]);

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Submit reply
    const handleSubmitReply = async () => {
        if (!user || !discussion || !replyContent.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/discussions/${discussion._id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    userName: user.name,
                    userAvatar: user.avatar || '',
                    content: replyContent.trim(),
                    parentReplyId: replyTo?.id || null
                })
            });

            if (res.ok) {
                const newReply = await res.json();
                setReplies(prev => [...prev, newReply]);
                setReplyContent('');
                setReplyTo(null);
                setDiscussion(prev => prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev);
            } else {
                const err = await res.json();
                setToast({ show: true, message: err.error || 'Gagal mengirim balasan' });
                setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
            }
        } catch (err) {
            console.error('Failed to submit reply:', err);
            setToast({ show: true, message: 'Terjadi kesalahan, coba lagi' });
            setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle reply to a specific reply
    const handleReplyToReply = (reply: Reply) => {
        setReplyTo({ id: reply._id, userName: reply.userName });
        replyInputRef.current?.focus();
        replyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Like discussion
    const handleLikeDiscussion = async () => {
        if (!user || !discussion) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/discussions/${discussion._id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, userName: user.name })
            });

            if (res.ok) {
                const data = await res.json();
                setDiscussion(prev => prev ? {
                    ...prev,
                    likes: data.isLiked
                        ? [...prev.likes, user.id]
                        : prev.likes.filter(id => id !== user.id)
                } : prev);
            }
        } catch (err) {
            console.error('Failed to like:', err);
        }
    };

    // Like reply
    const handleLikeReply = async (replyId: string) => {
        if (!user || !discussion) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/discussions/${discussion._id}/reply/${replyId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, userName: user.name })
            });

            if (res.ok) {
                const data = await res.json();
                setReplies(prev => prev.map(r =>
                    r._id === replyId
                        ? { ...r, likes: data.isLiked ? [...r.likes, user.id] : r.likes.filter(id => id !== user.id) }
                        : r
                ));
            }
        } catch (err) {
            console.error('Failed to like reply:', err);
        }
    };

    // Delete reply
    const handleDeleteReply = async (replyId: string) => {
        if (!user || !discussion) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/discussions/${discussion._id}/reply/${replyId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, isAdmin: user.isAdmin })
            });

            if (res.ok) {
                setReplies(prev => prev.filter(r => r._id !== replyId));
                setDiscussion(prev => prev ? { ...prev, replyCount: Math.max(0, prev.replyCount - 1) } : prev);
            }
        } catch (err) {
            console.error('Failed to delete reply:', err);
        }
    };

    // Delete discussion
    const handleDeleteDiscussion = async () => {
        if (!user || !discussion) return;
        if (!confirm('Yakin ingin menghapus diskusi ini?')) return;

        try {
            const res = await fetch(`${BACKEND_URL}/api/discussions/${discussion._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, isAdmin: user.isAdmin })
            });

            if (res.ok) {
                navigate('/community');
            }
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    // Get category color
    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'anime': return 'bg-purple-500/20 text-purple-400';
            case 'recommendation': return 'bg-green-500/20 text-green-400';
            case 'question': return 'bg-blue-500/20 text-blue-400';
            default: return 'bg-white/10 text-white/60';
        }
    };

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'anime': return 'Anime';
            case 'recommendation': return 'Rekomendasi';
            case 'question': return 'Pertanyaan';
            default: return 'Umum';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F0F1A] pt-24 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#6C5DD3] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="min-h-screen bg-[#0F0F1A] pt-24 flex items-center justify-center">
                <p className="text-white/50">Diskusi tidak ditemukan</p>
            </div>
        );
    }

    const isOwner = user && user.id === discussion.userId;
    const canDelete = isOwner || user?.isAdmin;

    return (
        <div className="min-h-screen bg-[#0F0F1A] pt-24 pb-12">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className="fixed top-20 left-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-xl bg-red-500/20 border-red-500/30"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
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

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/community')}
                    className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Kembali ke Komunitas
                </motion.button>

                {/* Discussion Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                            {discussion.userAvatar ? (
                                <img
                                    src={discussion.userAvatar}
                                    alt={discussion.userName}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center text-white font-bold text-lg">
                                    {discussion.userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {discussion.isPinned && <Pin className="w-4 h-4 text-yellow-400" />}
                                    {discussion.isLocked && <Lock className="w-4 h-4 text-red-400" />}
                                    <h1 className="text-xl md:text-2xl font-bold text-white">{discussion.title}</h1>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-sm text-white/50 flex-wrap">
                                    <span>@{discussion.userName}</span>
                                    {discussion.userRole && <RoleBadge role={discussion.userRole} />}
                                    <span>•</span>
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

                        {canDelete && (
                            <button
                                onClick={handleDeleteDiscussion}
                                className="p-2 text-white/40 hover:text-red-400 transition-colors"
                                title="Hapus diskusi"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert max-w-none mb-6">
                        <p className="text-white/80 whitespace-pre-wrap">{discussion.content}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                        <button
                            onClick={handleLikeDiscussion}
                            disabled={!user}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${user && discussion.likes.includes(user.id)
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-white/5 text-white/60 hover:text-red-400'
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${user && discussion.likes.includes(user.id) ? 'fill-current' : ''}`} />
                            {discussion.likes.length}
                        </button>
                        <span className="flex items-center gap-2 text-white/50">
                            <MessageCircle className="w-5 h-5" />
                            {discussion.replyCount} balasan
                        </span>
                    </div>
                </motion.div>

                {/* Reply Input */}
                {user && !discussion.isLocked ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-8"
                    >
                        <div className="flex gap-3">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5DD3] to-[#00C2FF] flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1">
                                <textarea
                                    ref={replyInputRef}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={replyTo ? `Membalas @${replyTo.userName}...` : "Tulis balasan..."}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#6C5DD3] resize-none"
                                    maxLength={2000}
                                />
                                {replyTo && (
                                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-[#6C5DD3]/10 rounded-lg">
                                        <Reply className="w-4 h-4 text-[#6C5DD3]" />
                                        <span className="text-sm text-[#6C5DD3]">Membalas @{replyTo.userName}</span>
                                        <button
                                            onClick={() => setReplyTo(null)}
                                            className="ml-auto p-1 hover:bg-white/10 rounded"
                                        >
                                            <X className="w-4 h-4 text-white/50" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex justify-end mt-2">
                                    <Button
                                        onClick={handleSubmitReply}
                                        disabled={!replyContent.trim() || submitting}
                                        className="bg-[#6C5DD3] hover:bg-[#5a4ec0]"
                                    >
                                        {submitting ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Kirim
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : discussion.isLocked ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 text-center">
                        <Lock className="w-5 h-5 text-red-400 mx-auto mb-2" />
                        <p className="text-red-400 text-sm">Diskusi ini telah dikunci</p>
                    </div>
                ) : (
                    <div className="bg-white/5 rounded-xl p-4 mb-8 text-center">
                        <p className="text-white/50 text-sm">
                            <Link to="/login" className="text-[#6C5DD3] hover:underline">Login</Link> untuk membalas diskusi ini
                        </p>
                    </div>
                )}

                {/* Replies */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        Balasan ({replies.length})
                    </h2>

                    {replies.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
                            <p className="text-white/50">Belum ada balasan. Jadilah yang pertama!</p>
                        </div>
                    ) : (
                        replies.map((reply, index) => (
                            <motion.div
                                key={reply._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/5 rounded-xl border border-white/10 p-4"
                            >
                                <div className="flex gap-3">
                                    {reply.userAvatar ? (
                                        <img
                                            src={reply.userAvatar}
                                            alt={reply.userName}
                                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5DD3]/50 to-[#00C2FF]/50 flex items-center justify-center text-white font-bold flex-shrink-0">
                                            {reply.userName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm flex-wrap">
                                                <span className="font-medium text-white">@{reply.userName}</span>
                                                {reply.userRole && <RoleBadge role={reply.userRole} />}
                                                <span className="text-white/40">•</span>
                                                <span className="text-white/40 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(reply.createdAt)}
                                                </span>
                                            </div>
                                            {(user && (user.id === reply.userId || user.isAdmin)) && (
                                                <button
                                                    onClick={() => handleDeleteReply(reply._id)}
                                                    className="p-1 text-white/30 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-white/80 mt-2 whitespace-pre-wrap">{reply.content}</p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <button
                                                onClick={() => handleLikeReply(reply._id)}
                                                disabled={!user}
                                                className={`flex items-center gap-1 text-sm transition-colors ${user && reply.likes.includes(user.id)
                                                    ? 'text-red-400'
                                                    : 'text-white/40 hover:text-red-400'
                                                    }`}
                                            >
                                                <Heart className={`w-4 h-4 ${user && reply.likes.includes(user.id) ? 'fill-current' : ''}`} />
                                                {reply.likes.length}
                                            </button>
                                            {user && !discussion.isLocked && (
                                                <button
                                                    onClick={() => handleReplyToReply(reply)}
                                                    className="flex items-center gap-1 text-sm text-white/40 hover:text-[#6C5DD3] transition-colors"
                                                >
                                                    <Reply className="w-4 h-4" />
                                                    Balas
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
