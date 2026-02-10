const express = require('express');
const router = express.Router();
const SkipTime = require('../models/SkipTime');
const { requireAdmin } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

// Get skip times for an anime episode
router.get('/:animeId/:episodeNumber', async (req, res) => {
    try {
        const { animeId, episodeNumber } = req.params;
        
        const skipTime = await SkipTime.findOne({
            animeId,
            episodeNumber: parseInt(episodeNumber)
        });

        if (!skipTime) {
            return res.json({
                found: false,
                op: { startTime: 0, endTime: 85 },
                ed: { startTime: null, endTime: null },
                markers: []
            });
        }

        res.json({
            found: true,
            op: skipTime.op,
            ed: skipTime.ed,
            markers: skipTime.markers,
            source: skipTime.source,
            duration: skipTime.duration
        });
    } catch (err) {
        console.error('[SkipTimes] Get error:', err.message);
        res.status(500).json({ error: 'Failed to get skip times' });
    }
});

// Get all skip times for an anime
router.get('/:animeId', async (req, res) => {
    try {
        const { animeId } = req.params;
        
        const skipTimes = await SkipTime.find({ animeId })
            .sort({ episodeNumber: 1 });

        res.json({
            animeId,
            episodes: skipTimes.map(st => ({
                episodeNumber: st.episodeNumber,
                op: st.op,
                ed: st.ed,
                markers: st.markers,
                source: st.source,
                duration: st.duration
            }))
        });
    } catch (err) {
        console.error('[SkipTimes] Get all error:', err.message);
        res.status(500).json({ error: 'Failed to get skip times' });
    }
});

// Create or update skip times (Admin only)
router.post('/', requireAdmin, validateBody([
    { field: 'animeId', required: true, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'episodeNumber', required: true, type: 'number', integer: true, min: 1 },
    { field: 'op', required: false, type: 'object' },
    { field: 'ed', required: false, type: 'object' },
    { field: 'markers', required: false, type: 'array' },
    { field: 'duration', required: false, type: 'number' }
]), async (req, res) => {
    try {
        const { animeId, episodeNumber, op, ed, markers, duration, malId } = req.body;
        const userId = req.user.id;

        // Validate time ranges
        console.log('[SkipTimes] Saving:', { animeId, episodeNumber, op, ed, duration });
        
        if (op) {
            if (typeof op.startTime !== 'number' || op.startTime < 0) {
                return res.status(400).json({ error: 'Invalid op.startTime', value: op.startTime });
            }
            if (typeof op.endTime !== 'number' || op.endTime <= op.startTime) {
                return res.status(400).json({ error: 'Invalid op.endTime - must be greater than startTime', startTime: op.startTime, endTime: op.endTime });
            }
        }

        if (ed) {
            if (typeof ed.startTime !== 'number' || ed.startTime < 0) {
                return res.status(400).json({ error: 'Invalid ed.startTime', value: ed.startTime });
            }
            if (typeof ed.endTime !== 'number' || ed.endTime <= ed.startTime) {
                return res.status(400).json({ error: 'Invalid ed.endTime - must be greater than startTime', startTime: ed.startTime, endTime: ed.endTime });
            }
        }

        const skipTime = await SkipTime.findOneAndUpdate(
            { animeId, episodeNumber },
            {
                animeId,
                episodeNumber,
                malId: malId || null,
                ...(op && { op }),
                ...(ed && { ed }),
                ...(markers && { markers }),
                ...(duration && { duration }),
                source: 'manual',
                updatedBy: userId
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'Skip times saved successfully',
            data: {
                animeId: skipTime.animeId,
                episodeNumber: skipTime.episodeNumber,
                op: skipTime.op,
                ed: skipTime.ed,
                markers: skipTime.markers,
                source: skipTime.source
            }
        });
    } catch (err) {
        console.error('[SkipTimes] Save error:', err.message);
        res.status(500).json({ error: 'Failed to save skip times' });
    }
});

// Bulk update skip times for multiple episodes (Admin only)
router.post('/bulk', requireAdmin, async (req, res) => {
    try {
        const { animeId, episodes, malId } = req.body;
        const userId = req.user.id;

        if (!animeId || !Array.isArray(episodes) || episodes.length === 0) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const results = [];
        const errors = [];

        for (const ep of episodes) {
            try {
                const { episodeNumber, op, ed, markers, duration } = ep;
                
                const skipTime = await SkipTime.findOneAndUpdate(
                    { animeId, episodeNumber },
                    {
                        animeId,
                        episodeNumber,
                        malId: malId || null,
                        ...(op && { op }),
                        ...(ed && { ed }),
                        ...(markers && { markers }),
                        ...(duration && { duration }),
                        source: 'manual',
                        updatedBy: userId
                    },
                    { upsert: true, new: true }
                );

                results.push({ episodeNumber, success: true });
            } catch (epErr) {
                errors.push({ episodeNumber: ep.episodeNumber, error: epErr.message });
            }
        }

        res.json({
            success: true,
            total: episodes.length,
            saved: results.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('[SkipTimes] Bulk save error:', err.message);
        res.status(500).json({ error: 'Failed to bulk save skip times' });
    }
});

// Delete skip times (Admin only)
router.delete('/:animeId/:episodeNumber', requireAdmin, async (req, res) => {
    try {
        const { animeId, episodeNumber } = req.params;
        
        await SkipTime.deleteOne({
            animeId,
            episodeNumber: parseInt(episodeNumber)
        });

        res.json({ success: true, message: 'Skip times deleted' });
    } catch (err) {
        console.error('[SkipTimes] Delete error:', err.message);
        res.status(500).json({ error: 'Failed to delete skip times' });
    }
});

// Copy skip times from one episode to others (Admin only)
router.post('/copy', requireAdmin, validateBody([
    { field: 'sourceAnimeId', required: true, type: 'string' },
    { field: 'sourceEpisode', required: true, type: 'number', integer: true },
    { field: 'targetEpisodes', required: true, type: 'array' }
]), async (req, res) => {
    try {
        const { sourceAnimeId, sourceEpisode, targetEpisodes } = req.body;
        const userId = req.user.id;

        // Get source skip times
        const source = await SkipTime.findOne({
            animeId: sourceAnimeId,
            episodeNumber: sourceEpisode
        });

        if (!source) {
            return res.status(404).json({ error: 'Source episode not found' });
        }

        const results = [];
        for (const targetEp of targetEpisodes) {
            const skipTime = await SkipTime.findOneAndUpdate(
                { animeId: sourceAnimeId, episodeNumber: targetEp },
                {
                    animeId: sourceAnimeId,
                    episodeNumber: targetEp,
                    op: source.op,
                    ed: source.ed,
                    markers: source.markers,
                    source: 'manual',
                    updatedBy: userId
                },
                { upsert: true, new: true }
            );
            results.push(targetEp);
        }

        res.json({
            success: true,
            message: `Copied skip times to ${results.length} episodes`,
            episodes: results
        });
    } catch (err) {
        console.error('[SkipTimes] Copy error:', err.message);
        res.status(500).json({ error: 'Failed to copy skip times' });
    }
});

module.exports = router;
