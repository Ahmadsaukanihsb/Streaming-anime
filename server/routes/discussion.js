const express = require('express');
const router = express.Router();
const Discussion = require('../models/Discussion');
const DiscussionReply = require('../models/DiscussionReply');
const Notification = require('../models/Notification');
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

// Get all discussions (with pagination)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, sort = 'latest' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = { isDeleted: false };
        if (category && category !== 'all') {
            query.category = category;
        }

        // Sort options
        let sortOption = { isPinned: -1, createdAt: -1 }; // Pinned first, then latest
        if (sort === 'popular') {
            sortOption = { isPinned: -1, replyCount: -1, createdAt: -1 };
        } else if (sort === 'likes') {
            sortOption = { isPinned: -1, 'likes.length': -1, createdAt: -1 };
        }

        const discussions = await Discussion.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Discussion.countDocuments(query);

        res.json({
            discussions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('[Discussion] Get all error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Get single discussion with replies
router.get('/:id', async (req, res) => {
    try {
        const discussion = await Discussion.findById(req.params.id).lean();
        if (!discussion || discussion.isDeleted) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        // Get replies
        const replies = await DiscussionReply.find({
            discussionId: discussion._id,
            isDeleted: false
        }).sort({ createdAt: 1 }).lean();

        res.json({ discussion, replies });
    } catch (err) {
        console.error('[Discussion] Get one error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Create new discussion (requires auth)
router.post('/', async (req, res) => {
    try {
        const { userId, userName, userAvatar, title, content, category, animeId, animeTitle, animePoster } = req.body;

        if (!userId || !userName || !title || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for banned words in title
        const bannedInTitle = await containsBannedWord(title);
        if (bannedInTitle) {
            return res.status(400).json({
                error: 'Judul mengandung kata terlarang',
                bannedWord: bannedInTitle
            });
        }

        // Check for banned words in content
        const bannedInContent = await containsBannedWord(content);
        if (bannedInContent) {
            return res.status(400).json({
                error: 'Konten mengandung kata terlarang',
                bannedWord: bannedInContent
            });
        }

        // Get user's community role
        const user = await User.findById(userId).select('communityRole isAdmin').lean();
        let userRole = 'member';
        if (user) {
            if (user.isAdmin) userRole = 'admin';
            else if (user.communityRole) userRole = user.communityRole;
        }

        const discussion = new Discussion({
            userId,
            userName,
            userAvatar: userAvatar || '',
            userRole,
            title: title.trim(),
            content: content.trim(),
            category: category || 'general',
            animeId: animeId || null,
            animeTitle: animeTitle || null,
            animePoster: animePoster || null
        });

        await discussion.save();
        console.log('[Discussion] Created:', discussion.title);

        res.status(201).json(discussion);
    } catch (err) {
        console.error('[Discussion] Create error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Update discussion (owner only)
router.put('/:id', async (req, res) => {
    try {
        const { userId, title, content, category } = req.body;

        const discussion = await Discussion.findById(req.params.id);
        if (!discussion || discussion.isDeleted) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        // Check ownership
        if (discussion.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (title) discussion.title = title.trim();
        if (content) discussion.content = content.trim();
        if (category) discussion.category = category;

        await discussion.save();
        res.json(discussion);
    } catch (err) {
        console.error('[Discussion] Update error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Delete discussion (owner or admin)
router.delete('/:id', async (req, res) => {
    try {
        const { userId, isAdmin } = req.body;

        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        // Check ownership or admin
        if (discussion.userId.toString() !== userId && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        discussion.isDeleted = true;
        await discussion.save();

        // Also soft delete all replies
        await DiscussionReply.updateMany(
            { discussionId: discussion._id },
            { isDeleted: true }
        );

        console.log('[Discussion] Deleted:', discussion.title);
        res.json({ success: true });
    } catch (err) {
        console.error('[Discussion] Delete error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Toggle like on discussion
router.post('/:id/like', async (req, res) => {
    try {
        const { userId, userName } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const discussion = await Discussion.findById(req.params.id);
        if (!discussion || discussion.isDeleted) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        const likeIndex = discussion.likes.indexOf(userId);
        if (likeIndex > -1) {
            // Unlike
            discussion.likes.splice(likeIndex, 1);
        } else {
            // Like
            discussion.likes.push(userId);

            // Create notification (don't notify yourself)
            if (discussion.userId.toString() !== userId) {
                try {
                    await Notification.create({
                        userId: discussion.userId,
                        type: 'like_discussion',
                        fromUserId: userId,
                        fromUserName: userName || 'Seseorang',
                        discussionId: discussion._id,
                        discussionTitle: discussion.title,
                        message: `${userName || 'Seseorang'} menyukai diskusi Anda: "${discussion.title.substring(0, 50)}..."`
                    });
                } catch (notifErr) {
                    console.error('[Notification] Create error:', notifErr.message);
                }
            }
        }

        await discussion.save();
        res.json({ likes: discussion.likes.length, isLiked: likeIndex === -1 });
    } catch (err) {
        console.error('[Discussion] Like error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Add reply to discussion
router.post('/:id/reply', async (req, res) => {
    try {
        const { userId, userName, userAvatar, content, parentReplyId } = req.body;

        if (!userId || !userName || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for banned words in content
        const bannedInContent = await containsBannedWord(content);
        if (bannedInContent) {
            return res.status(400).json({
                error: 'Balasan mengandung kata terlarang',
                bannedWord: bannedInContent
            });
        }

        const discussion = await Discussion.findById(req.params.id);
        if (!discussion || discussion.isDeleted) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        if (discussion.isLocked) {
            return res.status(403).json({ error: 'Discussion is locked' });
        }

        // Get user's community role
        const replyUser = await User.findById(userId).select('communityRole isAdmin').lean();
        let userRole = 'member';
        if (replyUser) {
            if (replyUser.isAdmin) userRole = 'admin';
            else if (replyUser.communityRole) userRole = replyUser.communityRole;
        }

        const reply = new DiscussionReply({
            discussionId: discussion._id,
            userId,
            userName,
            userAvatar: userAvatar || '',
            userRole,
            content: content.trim(),
            parentReplyId: parentReplyId || null
        });

        await reply.save();

        // Increment reply count
        discussion.replyCount += 1;
        await discussion.save();

        // Create notification (don't notify yourself)
        if (discussion.userId.toString() !== userId) {
            try {
                await Notification.create({
                    userId: discussion.userId,
                    type: 'reply',
                    fromUserId: userId,
                    fromUserName: userName,
                    discussionId: discussion._id,
                    discussionTitle: discussion.title,
                    replyId: reply._id,
                    message: `${userName} membalas diskusi Anda: "${discussion.title.substring(0, 50)}..."`
                });
            } catch (notifErr) {
                console.error('[Notification] Create error:', notifErr.message);
            }
        }

        console.log('[Discussion] Reply added to:', discussion.title);
        res.status(201).json(reply);
    } catch (err) {
        console.error('[Discussion] Reply error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Delete reply
router.delete('/:id/reply/:replyId', async (req, res) => {
    try {
        const { userId, isAdmin } = req.body;

        const reply = await DiscussionReply.findById(req.params.replyId);
        if (!reply) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        // Check ownership or admin
        if (reply.userId.toString() !== userId && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        reply.isDeleted = true;
        await reply.save();

        // Decrement reply count
        await Discussion.findByIdAndUpdate(req.params.id, { $inc: { replyCount: -1 } });

        res.json({ success: true });
    } catch (err) {
        console.error('[Discussion] Delete reply error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Toggle like on reply
router.post('/:id/reply/:replyId/like', async (req, res) => {
    try {
        const { userId, userName } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const reply = await DiscussionReply.findById(req.params.replyId);
        if (!reply || reply.isDeleted) {
            return res.status(404).json({ error: 'Reply not found' });
        }

        const discussion = await Discussion.findById(req.params.id);

        const likeIndex = reply.likes.indexOf(userId);
        if (likeIndex > -1) {
            reply.likes.splice(likeIndex, 1);
        } else {
            reply.likes.push(userId);

            // Create notification (don't notify yourself)
            if (reply.userId.toString() !== userId) {
                try {
                    await Notification.create({
                        userId: reply.userId,
                        type: 'like_reply',
                        fromUserId: userId,
                        fromUserName: userName || 'Seseorang',
                        discussionId: discussion?._id,
                        discussionTitle: discussion?.title,
                        replyId: reply._id,
                        message: `${userName || 'Seseorang'} menyukai balasan Anda`
                    });
                } catch (notifErr) {
                    console.error('[Notification] Create error:', notifErr.message);
                }
            }
        }

        await reply.save();
        res.json({ likes: reply.likes.length, isLiked: likeIndex === -1 });
    } catch (err) {
        console.error('[Discussion] Like reply error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Admin: Pin/Unpin discussion
router.post('/:id/pin', async (req, res) => {
    try {
        const { isAdmin } = req.body;
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin only' });
        }

        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        discussion.isPinned = !discussion.isPinned;
        await discussion.save();

        res.json({ isPinned: discussion.isPinned });
    } catch (err) {
        console.error('[Discussion] Pin error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Admin: Lock/Unlock discussion
router.post('/:id/lock', async (req, res) => {
    try {
        const { isAdmin } = req.body;
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin only' });
        }

        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        discussion.isLocked = !discussion.isLocked;
        await discussion.save();

        res.json({ isLocked: discussion.isLocked });
    } catch (err) {
        console.error('[Discussion] Lock error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

module.exports = router;
