const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get a setting by key
router.get('/:key', async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: req.params.key });
        if (!setting) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        res.json(setting.value);
    } catch (err) {
        console.error('[Settings GET Error]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save or update a setting (using atomic upsert to prevent duplicates)
router.post('/:key', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        
        // Check if body exists
        if (!req.body) {
            return res.status(400).json({ error: 'Request body is required' });
        }
        
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({ error: 'Value is required' });
        }

        // Use findOneAndUpdate with upsert for atomic operation
        const setting = await Settings.findOneAndUpdate(
            { key },
            { key, value },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, key, value: setting.value });
    } catch (err) {
        console.error('[Settings POST Error]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a setting
router.delete('/:key', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await Settings.deleteOne({ key: req.params.key });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Setting not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('[Settings DELETE Error]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all settings (optional, for debugging)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const settings = await Settings.find();
        const result = {};
        settings.forEach(s => {
            result[s.key] = s.value;
        });
        res.json(result);
    } catch (err) {
        console.error('[Settings GET ALL Error]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
