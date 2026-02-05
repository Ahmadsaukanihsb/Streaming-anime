import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { MessageCircle, Heart, Reply, Trash2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BACKEND_URL } from '@/config/api';
import { getAuthHeaders } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import SafeAvatar from '@/components/SafeAvatar';
import RoleBadge from '@/components/RoleBadge';

interface Comment {
    _id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    userRole?: string;
    content: string;
    likes: string[];
    likeCount: number;
    createdAt: string;
    replies?: Comment[];
}

interface CommentSectionProps {
    animeId: string;
    episodeNumber?: number;
    title?: string;
    size?: 'sm' | 'md';
}

export default function CommentSection({ animeId, episodeNumber, title, size = 'md' }: CommentSectionProps) {
    const { user } = useApp();
    const isSm = size === 'sm';
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    // Fetch comments
    useEffect(() => {
        fetchComments();
    }, [animeId, episodeNumber]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            setError(null);
            const endpoint = episodeNumber
                ? `${BACKEND_URL}/api/comments/${animeId}/episode/${episodeNumber}`
                : `${BACKEND_URL}/api/comments/${animeId}`;

            const response = await apiFetch(endpoint, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            const data = await response.json();
            setComments(data.comments || []);
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError('Gagal memuat komentar');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        setSubmitting(true);
        setError(null);

        try {
            const requestBody = {
                userId: user.id,
                userName: user.name,
                userAvatar: user.avatar || '',
                animeId,
                episodeNumber: episodeNumber || null,
                content: newComment.trim()
            };

            const response = await apiFetch(`${BACKEND_URL}/api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Gagal mengirim komentar');
            }

            setNewComment('');
            fetchComments();
        } catch (err: any) {
            console.error('Error posting comment:', err);
            setError(err.message || 'Gagal mengirim komentar. Coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!user || !replyContent.trim()) return;

        setSubmitting(true);
        try {
            const response = await apiFetch(`${BACKEND_URL}/api/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    userId: user.id,
                    userName: user.name,
                    userAvatar: user.avatar || '',
                    animeId,
                    episodeNumber: episodeNumber || null,
                    content: replyContent.trim(),
                    parentId
                })
            });

            if (response.ok) {
                setReplyContent('');
                setReplyingTo(null);
                fetchComments();
            }
        } catch (error) {
            console.error('Error posting reply:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (commentId: string) => {
        if (!user) return;

        try {
            const response = await apiFetch(`${BACKEND_URL}/api/comments/${commentId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ userId: user.id })
            });

            if (response.ok) {
                fetchComments();
            }
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!user) return;
        if (!confirm('Hapus komentar ini?')) return;

        try {
            const response = await apiFetch(`${BACKEND_URL}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    userId: user.id,
                    isAdmin: user.isAdmin === true
                })
            });

            if (response.ok) {
                fetchComments();
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 30) return `${diffDays} hari lalu`;
        return date.toLocaleDateString('id-ID');
    };

    const toggleReplies = (commentId: string) => {
        setExpandedReplies(prev => {
            const next = new Set(prev);
            if (next.has(commentId)) {
                next.delete(commentId);
            } else {
                next.add(commentId);
            }
            return next;
        });
    };

    const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
        const isLiked = user && comment.likes.includes(user.id);
        const isOwner = user && comment.userId === user.id;
        const isAdmin = user?.isAdmin === true;

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${isReply ? (isSm ? 'ml-10 mt-2' : 'ml-12 mt-3') : ''}`}
            >
                <div className={`flex ${isSm ? 'gap-2' : 'gap-3'}`}>
                    {/* Avatar */}
                    <SafeAvatar
                        src={comment.userAvatar}
                        name={comment.userName}
                        className={`${isSm ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-full flex-shrink-0`}
                        fallbackClassName={isSm ? 'text-xs' : 'text-sm'}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium text-white ${isSm ? 'text-xs' : 'text-sm'}`}>{comment.userName}</span>
                            {comment.userRole && <RoleBadge role={comment.userRole} size="sm" />}
                            <span className={`text-white/30 ${isSm ? 'text-[11px]' : 'text-xs'}`}>{formatTimeAgo(comment.createdAt)}</span>
                        </div>
                        <p className={`text-white/70 ${isSm ? 'text-xs' : 'text-sm'} mt-1 break-words`}>{comment.content}</p>

                        {/* Actions */}
                        <div className={`flex items-center ${isSm ? 'gap-3 mt-2' : 'gap-4 mt-2'}`}>
                            <button
                                onClick={() => handleLike(comment._id)}
                                className={`flex items-center gap-1 ${isSm ? 'text-[11px]' : 'text-xs'} transition-colors ${isLiked ? 'text-red-400' : 'text-white/40 hover:text-red-400'
                                    }`}
                            >
                                <Heart className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${isLiked ? 'fill-current' : ''}`} />
                                {comment.likeCount > 0 && comment.likeCount}
                            </button>

                            {!isReply && user && (
                                <button
                                    onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                    className={`flex items-center gap-1 ${isSm ? 'text-[11px]' : 'text-xs'} text-white/40 hover:text-[#6C5DD3] transition-colors`}
                                >
                                    <Reply className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                    Balas
                                </button>
                            )}

                            {(isOwner || isAdmin) && (
                                <button
                                    onClick={() => handleDelete(comment._id)}
                                    className={`flex items-center gap-1 ${isSm ? 'text-[11px]' : 'text-xs'} text-white/40 hover:text-red-400 transition-colors`}
                                >
                                    <Trash2 className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                </button>
                            )}
                        </div>

                        {/* Reply Form */}
                        <AnimatePresence>
                            {replyingTo === comment._id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={isSm ? 'mt-2' : 'mt-3'}
                                >
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder="Tulis balasan..."
                                            className={`flex-1 ${isSm ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm'} bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3]`}
                                        />
                                        <Button
                                            onClick={() => handleSubmitReply(comment._id)}
                                            disabled={!replyContent.trim() || submitting}
                                            size="sm"
                                            className={`bg-[#6C5DD3] hover:bg-[#5a4eb8] ${isSm ? 'h-8 px-3' : ''}`}
                                        >
                                            <Send className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Replies Toggle */}
                        {comment.replies && comment.replies.length > 0 && (
                            <button
                                onClick={() => toggleReplies(comment._id)}
                                className={`flex items-center gap-1 ${isSm ? 'mt-2 text-[11px]' : 'mt-3 text-xs'} text-[#6C5DD3] hover:text-[#8677e0] transition-colors`}
                            >
                                {expandedReplies.has(comment._id) ? (
                                    <>
                                        <ChevronUp className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                        Sembunyikan {comment.replies.length} balasan
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                        Lihat {comment.replies.length} balasan
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Replies */}
                <AnimatePresence>
                    {expandedReplies.has(comment._id) && comment.replies && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            {comment.replies.map((reply) => (
                                <CommentItem key={reply._id} comment={reply} isReply />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className={`bg-white/5 rounded-2xl border border-white/10 ${isSm ? 'p-3 md:p-4' : 'p-4 md:p-6'}`}>
            {/* Header */}
            <div className={`flex items-center gap-2 ${isSm ? 'mb-4' : 'mb-6'}`}>
                <MessageCircle className={`${isSm ? 'w-4 h-4' : 'w-5 h-5'} text-[#6C5DD3]`} />
                <h3 className={`font-semibold text-white ${isSm ? 'text-sm' : 'text-base'}`}>
                    {title || (episodeNumber ? `Komentar Episode ${episodeNumber}` : 'Komentar')}
                </h3>
                <span className={`text-white/50 ${isSm ? 'text-xs' : 'text-sm'}`}>({comments.length})</span>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Comment Form */}
            {user ? (
                <form onSubmit={handleSubmitComment} className={isSm ? 'mb-4' : 'mb-6'}>
                    <div className={`flex ${isSm ? 'gap-2' : 'gap-3'}`}>
                        <SafeAvatar
                            src={user.avatar}
                            name={user.name}
                            className={`${isSm ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} rounded-full flex-shrink-0`}
                            fallbackClassName={isSm ? 'text-xs' : 'text-sm'}
                        />
                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Tulis komentar..."
                                rows={2}
                                maxLength={1000}
                                className={`w-full ${isSm ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'} bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#6C5DD3] resize-none`}
                            />
                            <div className="flex items-center justify-between mt-2">
                                <span className={`text-white/30 ${isSm ? 'text-[11px]' : 'text-xs'}`}>{newComment.length}/1000</span>
                                <Button
                                    type="submit"
                                    disabled={!newComment.trim() || submitting}
                                    className={`bg-gradient-to-r from-[#6C5DD3] to-[#00C2FF] hover:opacity-90 ${isSm ? 'min-h-[36px] min-w-[88px] text-xs' : 'min-h-[44px] min-w-[100px]'} touch-manipulation`}
                                >
                                    <Send className={`${isSm ? 'w-3.5 h-3.5 mr-1.5' : 'w-4 h-4 mr-2'}`} />
                                    {submitting ? 'Mengirim...' : 'Kirim'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className={`${isSm ? 'mb-4 p-3' : 'mb-6 p-4'} bg-white/5 rounded-xl text-center`}>
                    <p className={`text-white/50 ${isSm ? 'text-xs' : 'text-sm'} mb-2`}>Login untuk berkomentar</p>
                    <Link
                        to="/login"
                        className={`inline-block ${isSm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} bg-[#6C5DD3] hover:bg-[#5a4eb8] rounded-lg text-white transition-colors`}
                    >
                        Login
                    </Link>
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div className={isSm ? 'space-y-3' : 'space-y-4'}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`flex ${isSm ? 'gap-2' : 'gap-3'} animate-pulse`}>
                            <SafeAvatar
                                loading
                                className={`${isSm ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex-shrink-0`}
                                skeletonClassName="bg-white/10"
                            />
                            <div className="flex-1 space-y-2">
                                <div className={`${isSm ? 'h-3' : 'h-4'} bg-white/10 rounded w-24`} />
                                <div className={`${isSm ? 'h-3' : 'h-4'} bg-white/10 rounded w-3/4`} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments.length > 0 ? (
                <div className={isSm ? 'space-y-4' : 'space-y-6'}>
                    {comments.map((comment) => (
                        <CommentItem key={comment._id} comment={comment} />
                    ))}
                </div>
            ) : (
                <div className={`text-center ${isSm ? 'py-6' : 'py-8'}`}>
                    <MessageCircle className={`${isSm ? 'w-10 h-10' : 'w-12 h-12'} text-white/10 mx-auto mb-3`} />
                    <p className="text-white/40">Belum ada komentar</p>
                    <p className={`text-white/30 ${isSm ? 'text-xs' : 'text-sm'}`}>Jadilah yang pertama berkomentar!</p>
                </div>
            )}
        </div>
    );
}
