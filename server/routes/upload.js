/**
 * Upload Routes for R2 Storage
 * Handles video upload to Cloudflare R2
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const r2 = require('../utils/r2-storage');
const { CustomAnime } = require('../models/CustomAnime');
const Notification = require('../models/Notification');
const ScheduleSubscription = require('../models/ScheduleSubscription');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

router.use(requireAuth);
router.use(requireAdmin);

// Create temp upload directory
const uploadDir = path.join(__dirname, '../temp_uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for disk storage (handles large files better)
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    }),
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024 // 2GB max file size
    },
    fileFilter: (req, file, cb) => {
        // Only allow video files
        const allowedMimes = ['video/mp4', 'video/webm', 'video/x-matroska', 'video/quicktime'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed (mp4, webm, mkv, mov)'));
        }
    }
});

/**
 * POST /api/upload/presign
 * Generate a presigned URL for direct browser-to-R2 upload
 * This bypasses the Cloudflare Tunnel limit (100MB)
 * 
 * Body:
 * - animeTitle: string
 * - episode: number
 * - quality: string (e.g., "720p", "1080p")
 * - contentType: string (optional, default: "video/mp4")
 */
router.post('/presign', validateBody([
    { field: 'animeTitle', required: true, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'episode', required: true, type: 'number', integer: true, min: 1 },
    { field: 'quality', required: false, type: 'string', minLength: 1, maxLength: 20 },
    { field: 'contentType', required: false, type: 'string', minLength: 1, maxLength: 100 }
]), async (req, res) => {
    try {
        const { animeTitle, episode, quality = '720p', contentType = 'video/mp4' } = req.body;

        if (!animeTitle || !episode) {
            return res.status(400).json({ error: 'animeTitle and episode are required' });
        }

        const episodeNum = parseInt(episode);
        const videoKey = r2.generateVideoKey(animeTitle, episodeNum, quality);

        console.log(`[Upload] Generating presigned URL for ${animeTitle} Episode ${episodeNum} (${quality})`);

        const result = await r2.getPresignedUploadUrl(videoKey, contentType, 3600);

        if (!result.success) {
            return res.status(500).json({ error: result.error || 'Failed to generate presigned URL' });
        }

        res.json({
            success: true,
            uploadUrl: result.uploadUrl,
            publicUrl: result.publicUrl,
            key: result.key,
            expiresIn: 3600
        });

    } catch (error) {
        console.error('[Upload] Presign error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate presigned URL' });
    }
});

/**
 * POST /api/upload/confirm
 * Confirm upload completion and update anime database
 * Called after direct browser upload to R2 completes
 * 
 * Body:
 * - animeId: string
 * - animeTitle: string  
 * - episode: number
 * - quality: string
 * - publicUrl: string
 */
router.post('/confirm', validateBody([
    { field: 'publicUrl', required: true, type: 'string', minLength: 1, maxLength: 1000 },
    { field: 'episode', required: true, type: 'number', integer: true, min: 1 },
    { field: 'animeId', required: false, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'animeTitle', required: false, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'quality', required: false, type: 'string', minLength: 1, maxLength: 20 }
]), async (req, res) => {
    try {
        const { animeId, animeTitle, episode, quality = '720p', publicUrl } = req.body;

        if (!publicUrl || !episode) {
            return res.status(400).json({ error: 'publicUrl and episode are required' });
        }

        const episodeNum = parseInt(episode);

        console.log(`[Upload] Confirming upload for ${animeTitle} Episode ${episodeNum}`);

        // Update anime's episodeData in MongoDB
        if (animeId) {
            try {
                let anime = await CustomAnime.findOne({ id: animeId });
                if (!anime && animeId.match(/^[0-9a-fA-F]{24}$/)) {
                    anime = await CustomAnime.findById(animeId);
                }

                if (anime) {
                    if (!anime.episodeData) anime.episodeData = [];

                    // Find or create episode entry
                    let epIndex = anime.episodeData.findIndex(e => e.ep === episodeNum);
                    if (epIndex === -1) {
                        anime.episodeData.push({ ep: episodeNum, streams: [] });
                        epIndex = anime.episodeData.length - 1;
                    }

                    // Initialize streams array if not exists
                    if (!anime.episodeData[epIndex].streams) {
                        anime.episodeData[epIndex].streams = [];
                    }

                    const streams = anime.episodeData[epIndex].streams;

                    // Find existing stream with SAME quality AND server
                    const existingStreamIdx = streams.findIndex(
                        s => s.quality === quality && s.server === 'R2 Cloud'
                    );

                    console.log(`[Upload] Episode ${episodeNum}: Found ${streams.length} existing streams, looking for ${quality} quality`);
                    console.log(`[Upload] Existing stream index for ${quality}: ${existingStreamIdx}`);

                    const streamEntry = {
                        url: publicUrl,
                        quality: quality,
                        server: 'R2 Cloud',
                        type: 'direct'
                    };

                    if (existingStreamIdx >= 0) {
                        // Update existing stream with same quality
                        anime.episodeData[epIndex].streams[existingStreamIdx] = streamEntry;
                        console.log(`[Upload] Updated existing ${quality} stream`);
                    } else {
                        // Add new stream (different quality)
                        anime.episodeData[epIndex].streams.push(streamEntry);
                        console.log(`[Upload] Added new ${quality} stream`);
                    }

                    // Update episodes count to reflect episodeData length
                    // Use max episode number to handle non-sequential episodes
                    const maxEpisode = Math.max(...anime.episodeData.map(e => e.ep));
                    anime.episodes = maxEpisode;
                    console.log(`[Upload] Updated episodes count to ${anime.episodes}`);

                    // Track last upload time
                    const now = new Date();
                    anime.lastEpisodeUpload = now;

                    // Only set jadwalRilis if it has not been set before
                    const hasSchedule = Boolean(anime.jadwalRilis && anime.jadwalRilis.hari);
                    if (!hasSchedule) {
                        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                        const currentDay = dayNames[now.getDay()];
                        const currentTime = now.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'Asia/Jakarta'
                        });

                        anime.jadwalRilis = {
                            hari: currentDay,
                            jam: currentTime
                        };
                        anime.markModified('jadwalRilis');
                        console.log(`[Upload] Set jadwalRilis: ${currentDay} ${currentTime}`);
                    } else {
                        console.log('[Upload] JadwalRilis already set, skipping update');
                    }

                    // Mark as modified for Mongoose
                    anime.markModified('episodeData');
                    await anime.save();
                    console.log(`[Upload] Saved episodeData for ${animeTitle} - Episode ${episodeNum} now has ${anime.episodeData[epIndex].streams.length} streams`);

                    // Send notifications to subscribed users
                    try {
                        const subscribers = await ScheduleSubscription.find({
                            animeId: animeId,
                            isActive: true
                        });

                        console.log(`[Upload] Found ${subscribers.length} subscribers for ${animeTitle}`);

                        if (subscribers.length > 0) {
                            const notifications = subscribers.map(sub => ({
                                userId: sub.userId,
                                type: 'new_episode',
                                animeId: animeId,
                                animeTitle: anime.title || animeTitle,
                                animePoster: anime.poster || sub.animePoster,
                                episodeNumber: episodeNum,
                                message: `Episode ${episodeNum} dari ${anime.title || animeTitle} sudah tersedia!`,
                                isRead: false
                            }));

                            await Notification.insertMany(notifications);
                            console.log(`[Upload] Sent ${notifications.length} notifications for ${animeTitle} Episode ${episodeNum}`);
                        }
                    } catch (notifErr) {
                        console.error('[Upload] Notification error:', notifErr.message);
                        // Don't fail the upload if notification fails
                    }
                }
            } catch (dbErr) {
                console.error('[Upload] DB update error:', dbErr);
            }
        }

        res.json({
            success: true,
            message: 'Upload confirmed and database updated',
            episode: episodeNum,
            quality: quality
        });

    } catch (error) {
        console.error('[Upload] Confirm error:', error);
        res.status(500).json({ error: error.message || 'Failed to confirm upload' });
    }
});

/**
 * POST /api/upload/video
 * Upload a video file for an anime episode
 * 
 * Body (multipart/form-data):
 * - video: File
 * - animeId: string (MongoDB ID of anime)
 * - animeTitle: string
 * - episode: number
 * - quality: string (e.g., "720p", "1080p")
 */
router.post('/video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const { animeId, animeTitle, episode, quality = '720p' } = req.body;

        if (!animeTitle || !episode) {
            return res.status(400).json({ error: 'animeTitle and episode are required' });
        }

        const episodeNum = parseInt(episode);

        console.log(`[Upload] Uploading video for ${animeTitle} Episode ${episodeNum} (${quality})`);

        // Generate unique key for the video
        const videoKey = r2.generateVideoKey(animeTitle, episodeNum, quality);

        // Upload to R2 using streaming (handles large files)
        const result = await r2.uploadFromPath(req.file.path, videoKey, req.file.mimetype);

        // Cleanup: delete temp file after upload
        try {
            fs.unlinkSync(req.file.path);
        } catch (cleanupErr) {
            console.log('[Upload] Temp file cleanup error:', cleanupErr.message);
        }

        if (!result.success) {
            return res.status(500).json({ error: result.error || 'Upload failed' });
        }

        // If animeId provided, update the anime's episodeData in MongoDB
        if (animeId) {
            try {
                // Try to find by string 'id' field first, then fallback to ObjectId
                let anime = await CustomAnime.findOne({ id: animeId });
                if (!anime) {
                    // Try ObjectId if it looks like one
                    if (animeId.match(/^[0-9a-fA-F]{24}$/)) {
                        anime = await CustomAnime.findById(animeId);
                    }
                }
                if (anime) {
                    // Initialize episodeData if not exists
                    if (!anime.episodeData) {
                        anime.episodeData = [];
                    }

                    // Find or create episode entry
                    let epData = anime.episodeData.find(e => e.ep === episodeNum);
                    if (!epData) {
                        epData = { ep: episodeNum, streams: [] };
                        anime.episodeData.push(epData);
                    }

                    // Add/update stream for this quality
                    const existingStreamIdx = epData.streams.findIndex(
                        s => s.quality === quality && s.server === 'R2 Cloud'
                    );

                    const streamEntry = {
                        url: result.url,
                        quality: quality,
                        server: 'R2 Cloud',
                        type: 'direct' // Direct video file, not embed
                    };

                    if (existingStreamIdx >= 0) {
                        epData.streams[existingStreamIdx] = streamEntry;
                    } else {
                        epData.streams.push(streamEntry);
                    }

                    // Update episodes count to reflect max episode number
                    const maxEpisode = Math.max(...anime.episodeData.map(e => e.ep));
                    anime.episodes = maxEpisode;
                    console.log(`[Upload] Updated episodes count to ${anime.episodes}`);

                    // Track last upload time
                    const now = new Date();
                    anime.lastEpisodeUpload = now;

                    // Only set jadwalRilis if it has not been set before
                    const hasSchedule = Boolean(anime.jadwalRilis && anime.jadwalRilis.hari);
                    if (!hasSchedule) {
                        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                        const currentDay = dayNames[now.getDay()];
                        const currentTime = now.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                            timeZone: 'Asia/Jakarta'
                        });

                        anime.jadwalRilis = {
                            hari: currentDay,
                            jam: currentTime
                        };
                        anime.markModified('jadwalRilis');
                        console.log(`[Upload] Set jadwalRilis: ${currentDay} ${currentTime}`);
                    } else {
                        console.log('[Upload] JadwalRilis already set, skipping update');
                    }
                    await anime.save();
                    console.log(`[Upload] Updated episodeData for ${animeTitle}`);
                }
            } catch (dbErr) {
                console.error('[Upload] DB update error:', dbErr);
                // Don't fail the request, video is already uploaded
            }
        }

        res.json({
            success: true,
            message: 'Video uploaded successfully',
            url: result.url,
            key: result.key,
            anime: animeTitle,
            episode: episodeNum,
            quality: quality
        });

    } catch (error) {
        console.error('[Upload] Error:', error);
        res.status(500).json({ error: error.message || 'Upload failed' });
    }
});

/**
 * DELETE /api/upload/video
 * Delete a video file from R2
 * Body: { key: "anime/slug/ep-1-720p.mp4" }
 */
router.delete('/video', validateBody([
    { field: 'key', required: true, type: 'string', minLength: 1, maxLength: 500 }
]), async (req, res) => {
    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'Video key is required' });
        }

        console.log(`[Upload] Deleting video: ${key}`);

        const result = await r2.deleteFile(key);

        if (!result.success) {
            return res.status(500).json({ error: result.error || 'Delete failed' });
        }

        res.json({
            success: true,
            message: 'Video deleted successfully',
            key: key
        });

    } catch (error) {
        console.error('[Upload] Delete error:', error);
        res.status(500).json({ error: error.message || 'Delete failed' });
    }
});

/**
 * GET /api/upload/list
 * List uploaded videos
 * Query: ?slug=anime-slug (optional)
 */
router.get('/list', async (req, res) => {
    try {
        const { slug } = req.query;
        const prefix = slug ? `anime/${slug}/` : 'anime/';

        const files = await r2.listFiles(prefix);

        res.json({
            success: true,
            files: files
        });

    } catch (error) {
        console.error('[Upload] List error:', error);
        res.status(500).json({ error: error.message || 'List failed' });
    }
});

/**
 * GET /api/upload/test
 * Test R2 connection
 */
router.get('/test', async (req, res) => {
    try {
        const files = await r2.listFiles('');
        res.json({
            success: true,
            message: 'R2 connection successful',
            bucketName: process.env.R2_BUCKET_NAME,
            publicUrl: process.env.R2_PUBLIC_URL,
            filesCount: files.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
