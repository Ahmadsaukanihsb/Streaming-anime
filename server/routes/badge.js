const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');

// Default badges to seed if none exist
const defaultBadges = [
    { roleId: 'member', name: 'Member', icon: 'User', bgColor: 'bg-gray-500/20', textColor: 'text-gray-400', order: 0, isSystem: true },
    { roleId: 'supporter', name: 'Supporter', icon: 'Heart', bgColor: 'bg-green-500/20', textColor: 'text-green-400', order: 1, isSystem: false },
    { roleId: 'knight', name: 'Knight', icon: 'Sword', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', order: 2, isSystem: false },
    { roleId: 'guardian', name: 'Guardian', icon: 'Shield', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', order: 3, isSystem: false },
    { roleId: 'legend', name: 'Legend', icon: 'Crown', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', order: 4, isSystem: false },
    { roleId: 'moderator', name: 'Moderator', icon: 'ShieldCheck', bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-400', order: 5, isSystem: true },
    { roleId: 'admin', name: 'Admin', icon: 'Star', bgColor: 'bg-red-500/20', textColor: 'text-red-400', order: 6, isSystem: true }
];

// Initialize default badges
async function initDefaultBadges() {
    try {
        const count = await Badge.countDocuments();
        if (count === 0) {
            await Badge.insertMany(defaultBadges);
            console.log('[Badge] Default badges initialized');
        }
    } catch (err) {
        console.error('[Badge] Init error:', err);
    }
}
initDefaultBadges();

// GET /api/badges - Get all badges (sorted by order)
router.get('/', async (req, res) => {
    try {
        const badges = await Badge.find({ isActive: true }).sort({ order: 1 });
        res.json(badges);
    } catch (err) {
        console.error('[Badge] Get all error:', err);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
});

// GET /api/badges/all - Get all badges including inactive (for admin)
router.get('/all', async (req, res) => {
    try {
        const badges = await Badge.find().sort({ order: 1 });
        res.json(badges);
    } catch (err) {
        console.error('[Badge] Get all admin error:', err);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
});

// POST /api/badges - Create new badge
router.post('/', async (req, res) => {
    try {
        const { roleId, name, icon, bgColor, textColor, order } = req.body;

        if (!roleId || !name) {
            return res.status(400).json({ error: 'roleId and name are required' });
        }

        // Check if roleId already exists
        const existing = await Badge.findOne({ roleId: roleId.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ error: 'Badge with this roleId already exists' });
        }

        const badge = new Badge({
            roleId: roleId.toLowerCase().trim(),
            name: name.trim(),
            icon: icon || 'Award',
            bgColor: bgColor || 'bg-gray-500/20',
            textColor: textColor || 'text-gray-400',
            order: order ?? 99,
            isSystem: false
        });

        await badge.save();
        console.log(`[Badge] Created: ${badge.name}`);
        res.status(201).json(badge);
    } catch (err) {
        console.error('[Badge] Create error:', err);
        res.status(500).json({ error: 'Failed to create badge' });
    }
});

// PUT /api/badges/:id - Update badge
router.put('/:id', async (req, res) => {
    try {
        const { name, icon, bgColor, textColor, order, isActive } = req.body;

        const badge = await Badge.findById(req.params.id);
        if (!badge) {
            return res.status(404).json({ error: 'Badge not found' });
        }

        // Update fields
        if (name !== undefined) badge.name = name.trim();
        if (icon !== undefined) badge.icon = icon;
        if (bgColor !== undefined) badge.bgColor = bgColor;
        if (textColor !== undefined) badge.textColor = textColor;
        if (order !== undefined) badge.order = order;
        if (isActive !== undefined) badge.isActive = isActive;

        await badge.save();
        console.log(`[Badge] Updated: ${badge.name}`);
        res.json(badge);
    } catch (err) {
        console.error('[Badge] Update error:', err);
        res.status(500).json({ error: 'Failed to update badge' });
    }
});

// DELETE /api/badges/:id - Delete badge (only non-system badges)
router.delete('/:id', async (req, res) => {
    try {
        const badge = await Badge.findById(req.params.id);
        if (!badge) {
            return res.status(404).json({ error: 'Badge not found' });
        }

        if (badge.isSystem) {
            return res.status(400).json({ error: 'Cannot delete system badge' });
        }

        await badge.deleteOne();
        console.log(`[Badge] Deleted: ${badge.name}`);
        res.json({ success: true, message: 'Badge deleted' });
    } catch (err) {
        console.error('[Badge] Delete error:', err);
        res.status(500).json({ error: 'Failed to delete badge' });
    }
});

// PUT /api/badges/reorder - Reorder badges
router.put('/reorder', async (req, res) => {
    try {
        const { orders } = req.body; // Array of { id, order }

        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: 'orders array required' });
        }

        for (const item of orders) {
            await Badge.findByIdAndUpdate(item.id, { order: item.order });
        }

        const badges = await Badge.find().sort({ order: 1 });
        res.json(badges);
    } catch (err) {
        console.error('[Badge] Reorder error:', err);
        res.status(500).json({ error: 'Failed to reorder badges' });
    }
});

module.exports = router;
