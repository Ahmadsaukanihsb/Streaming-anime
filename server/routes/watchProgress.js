const express = require('express');
const router = express.Router();
const WatchProgress = require('../models/WatchProgress');
const { requireAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

router.use(requireAuth);

// Get all watch progress for a user (for Continue Watching feature)
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const progressList = await WatchProgress.find({
            userId,
            completed: false,
            currentTime: { $gt: 5 } // Only show if watched more than 5 seconds
        }).sort({ updatedAt: -1 }).limit(20);

        res.json(progressList);
    } catch (err) {
        console.error('[WatchProgress GET ALL Error]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get watch progress for a specific anime/episode
router.get('/:animeId/:episodeNumber', async (req, res) => {
    try {
        const { animeId, episodeNumber } = req.params;
        const userId = req.user.id;

        const progress = await WatchProgress.findOne({
            animeId,
            episodeNumber: parseInt(episodeNumber),
            userId
        });

        if (!progress) {
            return res.json({ currentTime: 0, completed: false });
        }

        res.json({
            currentTime: progress.currentTime,
            duration: progress.duration,
            completed: progress.completed,
            updatedAt: progress.updatedAt
        });
    } catch (err) {
        console.error('[WatchProgress GET Error]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save watch progress
router.post('/:animeId/:episodeNumber', validateBody([
    { field: 'currentTime', required: true, type: 'number', min: 0 },
    { field: 'duration', required: false, type: 'number', min: 0 },
    { field: 'completed', required: false, type: 'boolean' }
]), async (req, res) => {
    try {
        const { animeId, episodeNumber } = req.params;
        const { currentTime, duration, completed } = req.body;
        const userId = req.user.id;

        let progress = await WatchProgress.findOne({
            animeId,
            episodeNumber: parseInt(episodeNumber),
            userId
        });

        if (progress) {
            // Update existing
            progress.currentTime = currentTime;
            if (duration) progress.duration = duration;
            if (completed !== undefined) progress.completed = completed;
            await progress.save();
        } else {
            // Create new
            progress = new WatchProgress({
                animeId,
                episodeNumber: parseInt(episodeNumber),
                userId,
                currentTime,
                duration: duration || 0,
                completed: completed || false
            });
            await progress.save();
        }

        res.json({ success: true, progress });
    } catch (err) {
        console.error('[WatchProgress POST Error]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete watch progress (when video completes or user clears history)
router.delete('/:animeId/:episodeNumber', async (req, res) => {
    try {
        const { animeId, episodeNumber } = req.params;
        const userId = req.user.id;

        await WatchProgress.deleteOne({
            animeId,
            episodeNumber: parseInt(episodeNumber),
            userId
        });

        res.json({ success: true });
    } catch (err) {
        console.error('[WatchProgress DELETE Error]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
