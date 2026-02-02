const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');
const BannedWord = require('../models/BannedWord');

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
        const { page = 1, limit = 20 } = req.query;

        const comments = await Comment.find({
            animeId,
            episodeNumber: null,
            isDeleted: false,
            parentId: null // Only top-level comments
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get replies for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({
                    parentId: comment._id,
                    isDeleted: false
                }).sort({ createdAt: 1 });

                return {
                    ...comment.toJSON(),
                    replies
                };
            })
        );

        const total = await Comment.countDocuments({
            animeId,
            episodeNumber: null,
            isDeleted: false,
            parentId: null
        });

        res.json({
            comments: commentsWithReplies,
            total,
            page: parseInt(page),
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
        const { page = 1, limit = 20 } = req.query;

        const comments = await Comment.find({
            animeId,
            episodeNumber: parseInt(episodeNumber),
            isDeleted: false,
            parentId: null
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Get replies
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({
                    parentId: comment._id,
                    isDeleted: false
                }).sort({ createdAt: 1 });

                return {
                    ...comment.toJSON(),
                    replies
                };
            })
        );

        const total = await Comment.countDocuments({
            animeId,
            episodeNumber: parseInt(episodeNumber),
            isDeleted: false,
            parentId: null
        });

        res.json({
            comments: commentsWithReplies,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching episode comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Create a new comment
router.post('/', async (req, res) => {
    try {
        const { userId, userName, userAvatar, animeId, episodeNumber, content, parentId } = req.body;

        if (!userId || !animeId || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (content.length > 1000) {
            return res.status(400).json({ error: 'Comment too long (max 1000 characters)' });
        }

        // Check if user is banned
        const user = await User.findById(userId);
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

        const comment = new Comment({
            userId,
            userName: userName || 'Anonymous',
            userAvatar: userAvatar || '',
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
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, content } = req.body;

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
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, isAdmin } = req.body;

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
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

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
