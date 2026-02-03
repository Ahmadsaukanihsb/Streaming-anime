const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Get user's notifications
router.get('/', async (req, res) => {
    try {
        const { limit = 20, page = 1 } = req.query;
        const userId = req.user.id;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Notification.countDocuments({ userId });
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.json({
            notifications,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('[Notification] Get error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Notification.countDocuments({ userId, isRead: false });
        res.json({ count });
    } catch (err) {
        console.error('[Notification] Unread count error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Mark all as read
router.post('/mark-read', async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] Mark read error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Mark single notification as read
router.post('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Ownership check
        if (notification.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] Mark single read error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Delete all notifications for user
router.delete('/clear-all', async (req, res) => {
    try {
        await Notification.deleteMany({ userId: req.user.id });
        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] Clear all error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Check ownership
        if (notification.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] Delete error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

module.exports = router;
