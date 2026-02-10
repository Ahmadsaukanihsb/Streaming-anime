const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');
const BannedWord = require('../models/BannedWord');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

// Helper function to check for banned words
async function containsBannedWord(text) {
    const bannedWords = await BannedWord.find({}, 'word');
    const words = bannedWords.map(b => b.word.toLowerCase());
    const textLower = text.toLowerCase();

    for (const word of words) {
        if (textLower.includes(word)) {
            return word;
        }
    }
    return null;
}

// Get comments for an anime (anime-level comments only)
router.get('/:animeId', async (req, res) => {
    try {
        const { animeId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20)); // Max 50 per page

        // Use aggregation to get comments with replies in a single query
        const commentsWithReplies = await Comment.aggregate([
            // Match top-level comments
            {
                $match: {
                    animeId,
                    episodeNumber: null,
                    isDeleted: false,
                    parentId: null
                }
            },
            // Sort by newest first
            { $sort: { createdAt: -1 } },
            // Pagination
            { $skip: (page - 1) * limit },
            { $limit: limit },
            // Lookup replies
            {
                $lookup: {
                    from: 'comments',
                    let: { commentId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$parentId', '$$commentId'] },
                                isDeleted: false
                            }
                        },
                        { $sort: { createdAt: 1 } }
                    ],
                    as: 'replies'
                }
            }
        ]);

        const total = await Comment.countDocuments({
            animeId,
            episodeNumber: null,
            isDeleted: false,
            parentId: null
        });

        res.json({
            comments: commentsWithReplies,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching anime comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Get comments for a specific episode
router.get('/:animeId/episode/:episodeNumber', async (req, res) => {
    try {
        const { animeId, episodeNumber } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20)); // Max 50 per page

        // Use aggregation to get comments with replies in a single query
        const commentsWithReplies = await Comment.aggregate([
            // Match episode comments
            {
                $match: {
                    animeId,
                    episodeNumber: parseInt(episodeNumber),
                    isDeleted: false,
                    parentId: null
                }
            },
            // Sort by newest first
            { $sort: { createdAt: -1 } },
            // Pagination
            { $skip: (page - 1) * limit },
            { $limit: limit },
            // Lookup replies
            {
                $lookup: {
                    from: 'comments',
                    let: { commentId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$parentId', '$$commentId'] },
                                isDeleted: false
                            }
                        },
                        { $sort: { createdAt: 1 } }
                    ],
                    as: 'replies'
                }
            }
        ]);

        const total = await Comment.countDocuments({
            animeId,
            episodeNumber: parseInt(episodeNumber),
            isDeleted: false,
            parentId: null
        });

        res.json({
            comments: commentsWithReplies,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching episode comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Create a new comment
router.post('/', requireAuth, validateBody([
    { field: 'animeId', required: true, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'content', required: true, type: 'string', minLength: 1, maxLength: 1000 },
    { field: 'episodeNumber', required: false, type: 'number', integer: true }
]), async (req, res) => {
    try {
        const { animeId, episodeNumber, content, parentId } = req.body;
        const userId = req.user.id;
        const userName = req.user.name;
        const userAvatar = req.user.avatar || '';

        if (!animeId || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (content.length > 1000) {
            return res.status(400).json({ error: 'Comment too long (max 1000 characters)' });
        }

        // Check if user is banned
        const user = await User.findById(userId).select('communityRole isAdmin isBanned');
        if (user && user.isBanned) {
            return res.status(403).json({ error: 'Akun Anda dibanned dan tidak bisa berkomentar' });
        }

        // Check for banned words
        const bannedWord = await containsBannedWord(content);
        if (bannedWord) {
            return res.status(400).json({
                error: 'Komentar mengandung kata yang tidak diizinkan',
                bannedWord: bannedWord
            });
        }

        const userRole = user?.isAdmin ? 'admin' : (user?.communityRole || 'member');
        const comment = new Comment({
            userId,
            userName: userName || 'Anonymous',
            userAvatar: userAvatar || '',
            userRole,
            animeId,
            episodeNumber: episodeNumber || null,
            content: content.trim(),
            parentId: parentId || null
        });

        await comment.save();

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// Update a comment (owner only)
router.put('/:id', requireAuth, validateBody([
    { field: 'content', required: true, type: 'string', minLength: 1, maxLength: 1000 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Not authorized to edit this comment' });
        }

        if (content.length > 1000) {
            return res.status(400).json({ error: 'Comment too long' });
        }

        comment.content = content.trim();
        await comment.save();

        res.json(comment);
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

// Delete a comment (soft delete, owner or admin)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.isAdmin;

        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.userId.toString() !== userId && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        comment.isDeleted = true;
        await comment.save();

        // Also soft delete all replies
        await Comment.updateMany(
            { parentId: id },
            { isDeleted: true }
        );

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// Toggle like on a comment
router.post('/:id/like', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const likeIndex = comment.likes.indexOf(userId);

        if (likeIndex > -1) {
            // Already liked, remove like
            comment.likes.splice(likeIndex, 1);
        } else {
            // Add like
            comment.likes.push(userId);
        }

        await comment.save();

        res.json({
            likes: comment.likes,
            likeCount: comment.likes.length,
            isLiked: likeIndex === -1
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

module.exports = router;
