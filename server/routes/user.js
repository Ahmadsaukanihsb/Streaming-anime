const express = require('express');
const router = express.Router();
const multer = require('multer');
const AnimeInteraction = require('../models/AnimeInteraction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { uploadFile } = require('../utils/r2-storage');
const { requireAuth } = require('../middleware/auth');
const { validateBody, EMAIL_REGEX } = require('../middleware/validate');

router.use(requireAuth);

function ensureSelf(req, res, userId) {
    if (userId && userId !== req.user.id) {
        res.status(403).json({ error: 'Not authorized' });
        return false;
    }
    return true;
}

// Configure multer for avatar uploads (memory storage for small files)
const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpg, png, webp, gif)'));
        }
    }
});

// Upload Avatar
router.put('/avatar', avatarUpload.single('avatar'), async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate unique filename
        const ext = req.file.mimetype.split('/')[1];
        const key = `avatars/${userId}-${Date.now()}.${ext}`;

        // Upload to R2
        const uploadResult = await uploadFile(req.file.buffer, key, req.file.mimetype);

        if (!uploadResult.success) {
            return res.status(500).json({ error: 'Failed to upload avatar', details: uploadResult.error });
        }

        // Update user avatar URL
        user.avatar = uploadResult.url;
        await user.save();

        res.json({
            success: true,
            avatarUrl: uploadResult.url,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error('[User] Avatar upload error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Get User Data (Bookmarks, History, etc)
router.get('/:userId', async (req, res) => {
    try {
        if (!ensureSelf(req, res, req.params.userId)) return;

        let interaction = await AnimeInteraction.findOne({ userId: req.user.id });
        if (!interaction) {
            // Create if not exists
            interaction = new AnimeInteraction({
                userId: req.user.id,
                bookmarks: [],
                watchlist: [],
                watchHistory: [],
                ratings: [],
                watchedEpisodes: [],
                subscribedAnime: [],
                settings: {}
            });
            await interaction.save();
        }
        res.json(interaction);
    } catch (err) {
        console.error('[User] Get user data error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Update Bookmarks
router.post('/bookmarks', validateBody([
    { field: 'animeId', required: true, type: 'string', minLength: 1, maxLength: 200 }
]), async (req, res) => {
    const { animeId } = req.body;
    const userId = req.user.id;
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
        if (!interaction) {
            interaction = new AnimeInteraction({ userId, bookmarks: [], watchlist: [], watchHistory: [] });
        }

        // Toggle
        if (interaction.bookmarks.includes(animeId)) {
            interaction.bookmarks = interaction.bookmarks.filter(id => id !== animeId);
        } else {
            interaction.bookmarks.push(animeId);
        }
        await interaction.save();
        res.json(interaction.bookmarks);
    } catch (err) {
        console.error('[User] Bookmarks error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Update Watchlist
router.post('/watchlist', validateBody([
    { field: 'animeId', required: true, type: 'string', minLength: 1, maxLength: 200 }
]), async (req, res) => {
    const { animeId } = req.body;
    const userId = req.user.id;
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
        if (!interaction) {
            interaction = new AnimeInteraction({ userId, watchlist: [] });
        }

        // Toggle
        if (interaction.watchlist.includes(animeId)) {
            interaction.watchlist = interaction.watchlist.filter(id => id !== animeId);
        } else {
            interaction.watchlist.push(animeId);
        }
        await interaction.save();
        res.json(interaction.watchlist);
    } catch (err) {
        console.error('[User] Watchlist error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Update History
router.post('/history', validateBody([
    { field: 'animeId', required: true, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'episodeId', required: true, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'episodeNumber', required: true, type: 'number', integer: true, min: 1 },
    { field: 'progress', required: true, type: 'number', min: 0, max: 100 }
]), async (req, res) => {
    const { animeId, episodeId, episodeNumber, progress } = req.body;
    const userId = req.user.id;
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
        if (!interaction) {
            interaction = new AnimeInteraction({ userId, watchHistory: [] });
        }

        // Remove existing entry for this episode
        interaction.watchHistory = interaction.watchHistory.filter(
            h => !(h.animeId === animeId && h.episodeId === episodeId)
        );

        // Add new entry
        interaction.watchHistory.push({
            animeId,
            episodeId,
            episodeNumber,
            progress,
            timestamp: Date.now()
        });

        await interaction.save();
        res.json(interaction.watchHistory);
    } catch (err) {
        console.error('[User] History error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// ==================== NEW ENDPOINTS ====================

// Rate Anime
router.post('/rating', validateBody([
    { field: 'animeId', required: true, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'rating', required: true, type: 'number', min: 0, max: 10 }
]), async (req, res) => {
    const { animeId, rating } = req.body;
    const userId = req.user.id;
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
        if (!interaction) {
            interaction = new AnimeInteraction({ userId, ratings: [] });
        }

        // Remove existing rating for this anime
        interaction.ratings = interaction.ratings.filter(r => r.animeId !== animeId);

        // Add new rating
        if (rating > 0) {
            interaction.ratings.push({
                animeId,
                rating,
                ratedAt: new Date()
            });
        }

        await interaction.save();
        res.json(interaction.ratings);
    } catch (err) {
        console.error('[User] Rating error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Delete Rating
router.delete('/rating/:userId/:animeId', async (req, res) => {
    const { userId, animeId } = req.params;
    if (!ensureSelf(req, res, userId)) return;
    try {
        let interaction = await AnimeInteraction.findOne({ userId: req.user.id });
        if (!interaction) {
            return res.status(404).json({ msg: 'User not found' });
        }

        interaction.ratings = interaction.ratings.filter(r => r.animeId !== animeId);
        await interaction.save();
        res.json(interaction.ratings);
    } catch (err) {
        console.error('[User] Delete rating error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Toggle Watched Episode
router.post('/watched-episode', validateBody([
    { field: 'animeId', required: true, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'episodeNumber', required: true, type: 'number', integer: true, min: 1 }
]), async (req, res) => {
    const { animeId, episodeNumber } = req.body;
    const userId = req.user.id;
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
        if (!interaction) {
            interaction = new AnimeInteraction({ userId, watchedEpisodes: [] });
        }

        // Find or create anime entry
        let animeEntry = interaction.watchedEpisodes.find(w => w.animeId === animeId);
        if (!animeEntry) {
            interaction.watchedEpisodes.push({ animeId, episodes: [] });
            animeEntry = interaction.watchedEpisodes.find(w => w.animeId === animeId);
        }

        // Toggle episode
        if (animeEntry.episodes.includes(episodeNumber)) {
            animeEntry.episodes = animeEntry.episodes.filter(ep => ep !== episodeNumber);
        } else {
            animeEntry.episodes.push(episodeNumber);
        }

        await interaction.save();
        res.json(interaction.watchedEpisodes);
    } catch (err) {
        console.error('[User] Watched episode error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Get Watched Episodes for an Anime
router.get('/watched-episodes/:userId/:animeId', async (req, res) => {
    const { userId, animeId } = req.params;
    if (!ensureSelf(req, res, userId)) return;
    try {
        let interaction = await AnimeInteraction.findOne({ userId: req.user.id });
        if (!interaction) {
            return res.json({ episodes: [] });
        }

        const animeEntry = interaction.watchedEpisodes.find(w => w.animeId === animeId);
        res.json({ episodes: animeEntry ? animeEntry.episodes : [] });
    } catch (err) {
        console.error('[User] Get watched episodes error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Toggle Anime Subscription (for notifications)
router.post('/subscribe', validateBody([
    { field: 'animeId', required: true, type: 'string', minLength: 1, maxLength: 200 }
]), async (req, res) => {
    const { animeId } = req.body;
    const userId = req.user.id;
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
        if (!interaction) {
            interaction = new AnimeInteraction({ userId, subscribedAnime: [] });
        }

        // Toggle
        if (interaction.subscribedAnime.includes(animeId)) {
            interaction.subscribedAnime = interaction.subscribedAnime.filter(id => id !== animeId);
        } else {
            interaction.subscribedAnime.push(animeId);
        }

        await interaction.save();
        res.json(interaction.subscribedAnime);
    } catch (err) {
        console.error('[User] Subscribe error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Get Notifications
router.get('/notifications/:userId', async (req, res) => {
    try {
        if (!ensureSelf(req, res, req.params.userId)) return;
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Backward compatibility: include "read" alias
        const mapped = notifications.map(n => ({
            ...n,
            read: n.isRead
        }));

        res.json(mapped);
    } catch (err) {
        console.error('[User] Get notifications error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Add Notification (for system/admin use)
router.post('/notifications', validateBody([
    { field: 'type', required: false, type: 'string', minLength: 1, maxLength: 50 },
    { field: 'title', required: false, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'message', required: false, type: 'string', minLength: 1, maxLength: 500 },
    { field: 'animeId', required: false, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'animeTitle', required: false, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'animePoster', required: false, type: 'string', minLength: 1, maxLength: 500 },
    { field: 'episodeNumber', required: false, type: 'number', integer: true, min: 1 }
], { atLeastOne: ['title', 'message'] }), async (req, res) => {
    const { type, title, message, animeId, animeTitle, animePoster, episodeNumber } = req.body;
    const userId = req.user.id;
    try {
        const allowedTypes = new Set([
            'like_discussion',
            'like_reply',
            'reply',
            'mention',
            'new_episode',
            'system',
            'anime',
            'episode'
        ]);
        const normalizedType = allowedTypes.has(type) ? type : 'system';

        await Notification.create({
            userId,
            type: normalizedType,
            message: message || title || 'Notifikasi',
            animeId: animeId || undefined,
            animeTitle: animeTitle || undefined,
            animePoster: animePoster || undefined,
            episodeNumber: episodeNumber || undefined,
            isRead: false
        });

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const mapped = notifications.map(n => ({
            ...n,
            read: n.isRead
        }));

        res.json(mapped);
    } catch (err) {
        console.error('[User] Add notification error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Mark Notification as Read
router.put('/notifications/read', validateBody([
    { field: 'notificationId', required: true, type: 'string', minLength: 1, maxLength: 200 }
]), async (req, res) => {
    const { notificationId } = req.body;
    try {
        if (!notificationId) {
            return res.status(400).json({ error: 'notificationId is required' });
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const mapped = notifications.map(n => ({
            ...n,
            read: n.isRead
        }));

        res.json(mapped);
    } catch (err) {
        console.error('[User] Mark notification read error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Mark All Notifications as Read
router.put('/notifications/read-all/:userId', async (req, res) => {
    try {
        if (!ensureSelf(req, res, req.params.userId)) return;
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );

        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const mapped = notifications.map(n => ({
            ...n,
            read: n.isRead
        }));

        res.json(mapped);
    } catch (err) {
        console.error('[User] Mark all notifications read error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Get User Settings
router.get('/settings/:userId', async (req, res) => {
    try {
        if (!ensureSelf(req, res, req.params.userId)) return;
        let interaction = await AnimeInteraction.findOne({ userId: req.user.id });
        if (!interaction) {
            return res.json({
                autoPlayNext: true,
                autoSkipIntro: false,
                defaultQuality: '1080',
                notifyNewEpisode: true,
                notifyNewAnime: true
            });
        }
        res.json(interaction.settings || {});
    } catch (err) {
        console.error('[User] Get settings error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Update User Settings
router.put('/settings', async (req, res) => {
    const { settings } = req.body;
    const userId = req.user.id;
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
        if (!interaction) {
            interaction = new AnimeInteraction({ userId, settings: {} });
        }

        // Merge settings
        interaction.settings = {
            ...interaction.settings,
            ...settings
        };

        await interaction.save();
        res.json(interaction.settings);
    } catch (err) {
        console.error('[User] Update settings error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Delete Watch History
router.delete('/history/:userId', async (req, res) => {
    try {
        if (!ensureSelf(req, res, req.params.userId)) return;
        let interaction = await AnimeInteraction.findOne({ userId: req.user.id });
        if (!interaction) {
            return res.status(404).json({ msg: 'User not found' });
        }

        interaction.watchHistory = [];
        await interaction.save();

        res.json({ msg: 'History deleted' });
    } catch (err) {
        console.error('[User] Delete history error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Update User Profile (name, email)
router.put('/profile', validateBody([
    { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 80 },
    { field: 'email', required: false, type: 'string', minLength: 5, maxLength: 254, pattern: EMAIL_REGEX }
], { atLeastOne: ['name', 'email'] }), async (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).json({ error: 'Email sudah digunakan oleh user lain' });
            }
        }

        // Update fields
        if (name) user.name = name.trim();
        if (email) user.email = email.toLowerCase().trim();

        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error('[User] Update profile error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

module.exports = router;

