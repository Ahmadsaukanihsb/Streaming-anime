const express = require('express');
const router = express.Router();
const ScheduleSubscription = require('../models/ScheduleSubscription');

// Get user's subscriptions
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const subscriptions = await ScheduleSubscription.find({ userId, isActive: true })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ subscriptions });
    } catch (err) {
        console.error('[Schedule Subscription] Get error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Get subscribed anime IDs only (for quick lookup)
router.get('/ids', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const subscriptions = await ScheduleSubscription.find({ userId, isActive: true })
            .select('animeId')
            .lean();

        const animeIds = subscriptions.map(s => s.animeId);
        res.json({ animeIds });
    } catch (err) {
        console.error('[Schedule Subscription] Get IDs error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Toggle subscription (subscribe/unsubscribe)
router.post('/toggle', async (req, res) => {
    try {
        const { userId, animeId, animeTitle, animePoster, scheduleDay, scheduleTime } = req.body;

        if (!userId || !animeId) {
            return res.status(400).json({ error: 'userId and animeId required' });
        }

        // Check if already subscribed
        const existing = await ScheduleSubscription.findOne({ userId, animeId });

        if (existing) {
            // Unsubscribe - delete the subscription
            await ScheduleSubscription.findByIdAndDelete(existing._id);
            console.log('[Schedule] Unsubscribed:', animeTitle);
            res.json({ subscribed: false, message: 'Unsubscribed' });
        } else {
            // Subscribe - create new subscription
            await ScheduleSubscription.create({
                userId,
                animeId,
                animeTitle: animeTitle || 'Unknown',
                animePoster: animePoster || '',
                scheduleDay: scheduleDay || null,
                scheduleTime: scheduleTime || null
            });
            console.log('[Schedule] Subscribed:', animeTitle);
            res.json({ subscribed: true, message: 'Subscribed' });
        }
    } catch (err) {
        console.error('[Schedule Subscription] Toggle error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Check if subscribed to specific anime
router.get('/check', async (req, res) => {
    try {
        const { userId, animeId } = req.query;

        if (!userId || !animeId) {
            return res.status(400).json({ error: 'userId and animeId required' });
        }

        const subscription = await ScheduleSubscription.findOne({ userId, animeId, isActive: true });
        res.json({ subscribed: !!subscription });
    } catch (err) {
        console.error('[Schedule Subscription] Check error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Unsubscribe from specific anime
router.delete('/:animeId', async (req, res) => {
    try {
        const { userId } = req.body;
        const { animeId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        await ScheduleSubscription.findOneAndDelete({ userId, animeId });
        res.json({ success: true });
    } catch (err) {
        console.error('[Schedule Subscription] Delete error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

module.exports = router;
