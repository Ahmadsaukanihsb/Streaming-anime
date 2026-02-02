const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { CustomAnime } = require('../models/CustomAnime');
const Comment = require('../models/Comment');
const BannedWord = require('../models/BannedWord');
const Activity = require('../models/Activity');

// Helper function to log activity
async function logActivity(type, description, itemId, itemTitle, userName = 'System') {
    try {
        await Activity.create({ type, description, itemId, itemTitle, userName });
    } catch (err) {
        console.error('[Activity] Failed to log:', err);
    }
}

// ==================== STATS ====================

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, totalAnime, totalComments] = await Promise.all([
            User.countDocuments(),
            CustomAnime.countDocuments(),
            Comment.countDocuments()
        ]);

        // Total episodes (sum of all episodeData lengths)
        const animeWithEpisodes = await CustomAnime.find({}, 'episodeData');
        const totalEpisodes = animeWithEpisodes.reduce((sum, anime) => {
            return sum + (anime.episodeData?.length || 0);
        }, 0);

        // Total views
        const viewsResult = await CustomAnime.aggregate([
            { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]);
        const totalViews = viewsResult[0]?.totalViews || 0;

        // Recent stats (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const [newUsers, newComments] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: weekAgo } }),
            Comment.countDocuments({ createdAt: { $gte: weekAgo } })
        ]);

        // Top 5 popular anime by views
        const topAnime = await CustomAnime.find()
            .sort({ views: -1 })
            .limit(5)
            .select('id title poster views rating');

        // Recent users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email avatar createdAt isAdmin isBanned');

        // Recent activity
        const recentActivity = await Activity.find()
            .sort({ createdAt: -1 })
            .limit(10);

        // Admin count
        const adminCount = await User.countDocuments({ isAdmin: true });
        const bannedCount = await User.countDocuments({ isBanned: true });

        res.json({
            totals: {
                users: totalUsers,
                anime: totalAnime,
                episodes: totalEpisodes,
                comments: totalComments,
                views: totalViews,
                admins: adminCount,
                banned: bannedCount
            },
            weekly: {
                newUsers,
                newComments
            },
            topAnime,
            recentUsers,
            recentActivity
        });
    } catch (err) {
        console.error('[Admin] Stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users - List all users with pagination
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const filter = req.query.filter || 'all'; // all, admin, banned, active

        let query = {};

        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter
        if (filter === 'admin') query.isAdmin = true;
        else if (filter === 'banned') query.isBanned = true;
        else if (filter === 'active') query.isBanned = { $ne: true };

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('-password');

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('[Admin] Users list error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// PUT /api/admin/users/:id/ban - Ban user
router.put('/users/:id/ban', async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                isBanned: true,
                bannedAt: new Date(),
                bannedReason: reason || 'Tidak ada alasan'
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[Admin] User banned: ${user.email}`);
        res.json({ success: true, user });
    } catch (err) {
        console.error('[Admin] Ban user error:', err);
        res.status(500).json({ error: 'Failed to ban user' });
    }
});

// PUT /api/admin/users/:id/unban - Unban user
router.put('/users/:id/unban', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                isBanned: false,
                bannedAt: null,
                bannedReason: null
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[Admin] User unbanned: ${user.email}`);
        res.json({ success: true, user });
    } catch (err) {
        console.error('[Admin] Unban user error:', err);
        res.status(500).json({ error: 'Failed to unban user' });
    }
});

// PUT /api/admin/users/:id/promote - Make user admin
router.put('/users/:id/promote', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isAdmin: true },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[Admin] User promoted to admin: ${user.email}`);
        res.json({ success: true, user });
    } catch (err) {
        console.error('[Admin] Promote user error:', err);
        res.status(500).json({ error: 'Failed to promote user' });
    }
});

// PUT /api/admin/users/:id/demote - Remove admin status
router.put('/users/:id/demote', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isAdmin: false },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[Admin] User demoted from admin: ${user.email}`);
        res.json({ success: true, user });
    } catch (err) {
        console.error('[Admin] Demote user error:', err);
        res.status(500).json({ error: 'Failed to demote user' });
    }
});

// PUT /api/admin/users/:id/badge - Update user badge/communityRole
router.put('/users/:id/badge', async (req, res) => {
    try {
        const { communityRole } = req.body;
        const allowedRoles = ['member', 'supporter', 'knight', 'guardian', 'legend', 'moderator', 'admin'];

        if (!allowedRoles.includes(communityRole)) {
            return res.status(400).json({ error: 'Invalid community role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { communityRole },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`[Admin] User badge updated: ${user.email} -> ${communityRole}`);
        res.json({ success: true, user });
    } catch (err) {
        console.error('[Admin] Update badge error:', err);
        res.status(500).json({ error: 'Failed to update badge' });
    }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Also delete user's comments
        await Comment.deleteMany({ userId: req.params.id });

        console.log(`[Admin] User deleted: ${user.email}`);
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        console.error('[Admin] Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ==================== CONTENT MODERATION ====================

// GET /api/admin/banned-words - Get all banned words
router.get('/banned-words', async (req, res) => {
    try {
        const words = await BannedWord.find().sort({ createdAt: -1 });
        res.json(words);
    } catch (err) {
        console.error('[Admin] Get banned words error:', err);
        res.status(500).json({ error: 'Failed to fetch banned words' });
    }
});

// POST /api/admin/banned-words - Add banned word
router.post('/banned-words', async (req, res) => {
    try {
        const { word, addedBy } = req.body;

        if (!word || word.trim().length < 2) {
            return res.status(400).json({ error: 'Word must be at least 2 characters' });
        }

        const existing = await BannedWord.findOne({ word: word.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ error: 'Word already banned' });
        }

        const bannedWord = new BannedWord({
            word: word.toLowerCase().trim(),
            addedBy
        });
        await bannedWord.save();

        console.log(`[Admin] Banned word added: ${word}`);
        res.json({ success: true, bannedWord });
    } catch (err) {
        console.error('[Admin] Add banned word error:', err);
        res.status(500).json({ error: 'Failed to add banned word' });
    }
});

// DELETE /api/admin/banned-words/:id - Remove banned word
router.delete('/banned-words/:id', async (req, res) => {
    try {
        const word = await BannedWord.findByIdAndDelete(req.params.id);

        if (!word) {
            return res.status(404).json({ error: 'Word not found' });
        }

        console.log(`[Admin] Banned word removed: ${word.word}`);
        res.json({ success: true, message: 'Word removed' });
    } catch (err) {
        console.error('[Admin] Remove banned word error:', err);
        res.status(500).json({ error: 'Failed to remove banned word' });
    }
});

// POST /api/admin/banned-words/bulk - Add multiple banned words
router.post('/banned-words/bulk', async (req, res) => {
    try {
        const { words, addedBy } = req.body;

        if (!words || !Array.isArray(words)) {
            return res.status(400).json({ error: 'Words array required' });
        }

        const added = [];
        const skipped = [];

        for (const word of words) {
            const trimmed = word.toLowerCase().trim();
            if (trimmed.length < 2) continue;

            const existing = await BannedWord.findOne({ word: trimmed });
            if (existing) {
                skipped.push(trimmed);
                continue;
            }

            await BannedWord.create({ word: trimmed, addedBy });
            added.push(trimmed);
        }

        res.json({ success: true, added, skipped });
    } catch (err) {
        console.error('[Admin] Bulk add banned words error:', err);
        res.status(500).json({ error: 'Failed to add banned words' });
    }
});

module.exports = router;
