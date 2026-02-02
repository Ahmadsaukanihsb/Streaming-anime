const express = require('express');
const router = express.Router();
const multer = require('multer');
const AnimeInteraction = require('../models/AnimeInteraction');
const User = require('../models/User');
const { uploadFile } = require('../utils/r2-storage');

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
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

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
        let interaction = await AnimeInteraction.findOne({ userId: req.params.userId });
        if (!interaction) {
            // Create if not exists
            interaction = new AnimeInteraction({
                userId: req.params.userId,
                bookmarks: [],
                watchlist: [],
                watchHistory: [],
                ratings: [],
                watchedEpisodes: [],
                subscribedAnime: [],
                notifications: [],
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
router.post('/bookmarks', async (req, res) => {
    const { userId, animeId } = req.body;
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
router.post('/watchlist', async (req, res) => {
    const { userId, animeId } = req.body;
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
router.post('/history', async (req, res) => {
    const { userId, animeId, episodeId, episodeNumber, progress } = req.body;
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
router.post('/rating', async (req, res) => {
    const { userId, animeId, rating } = req.body;
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
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
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
router.post('/watched-episode', async (req, res) => {
    const { userId, animeId, episodeNumber } = req.body;
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
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
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
router.post('/subscribe', async (req, res) => {
    const { userId, animeId } = req.body;
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
        let interaction = await AnimeInteraction.findOne({ userId: req.params.userId });
        if (!interaction) {
            return res.json([]);
        }
        // Return notifications sorted by date (newest first)
        const notifications = interaction.notifications.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        res.json(notifications);
    } catch (err) {
        console.error('[User] Get notifications error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Add Notification (for system/admin use)
router.post('/notifications', async (req, res) => {
    const { userId, type, title, message, animeId } = req.body;
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
        if (!interaction) {
            interaction = new AnimeInteraction({ userId, notifications: [] });
        }

        interaction.notifications.push({
            type: type || 'system',
            title,
            message,
            animeId,
            read: false,
            createdAt: new Date()
        });

        await interaction.save();
        res.json(interaction.notifications);
    } catch (err) {
        console.error('[User] Add notification error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Mark Notification as Read
router.put('/notifications/read', async (req, res) => {
    const { userId, notificationId } = req.body;
    try {
        let interaction = await AnimeInteraction.findOne({ userId });
        if (!interaction) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const notification = interaction.notifications.id(notificationId);
        if (notification) {
            notification.read = true;
            await interaction.save();
        }

        res.json(interaction.notifications);
    } catch (err) {
        console.error('[User] Mark notification read error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Mark All Notifications as Read
router.put('/notifications/read-all/:userId', async (req, res) => {
    try {
        let interaction = await AnimeInteraction.findOne({ userId: req.params.userId });
        if (!interaction) {
            return res.status(404).json({ msg: 'User not found' });
        }

        interaction.notifications.forEach(n => n.read = true);
        await interaction.save();

        res.json(interaction.notifications);
    } catch (err) {
        console.error('[User] Mark all notifications read error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Get User Settings
router.get('/settings/:userId', async (req, res) => {
    try {
        let interaction = await AnimeInteraction.findOne({ userId: req.params.userId });
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
    const { userId, settings } = req.body;
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
        let interaction = await AnimeInteraction.findOne({ userId: req.params.userId });
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
router.put('/profile', async (req, res) => {
    const { userId, name, email } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

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

