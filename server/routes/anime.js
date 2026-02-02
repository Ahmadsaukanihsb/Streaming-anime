const express = require('express');
const router = express.Router();
const { CustomAnime, DeletedAnime } = require('../models/CustomAnime');
const ViewHistory = require('../models/ViewHistory');
const otakudesu = require('../utils/otakudesu-scraper');
const quinime = require('../utils/quinime-scraper');
const nonton = require('../utils/nontonanimeid-scraper');
const { generateSubtitle, checkFFmpeg, translateText } = require('../utils/subtitle-generator');
const { uploadFile: uploadToR2 } = require('../utils/r2-storage');

// Get all custom anime (that are not deleted)
router.get('/custom', async (req, res) => {
    try {
        // get blacklist
        const deleted = await DeletedAnime.find().select('animeId');
        const deletedIds = deleted.map(d => d.animeId);

        const customAnimes = await CustomAnime.find({
            id: { $nin: deletedIds }
        });
        res.json(customAnimes);
    } catch (err) {
        console.error('[Anime] Get custom anime error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Get Blacklist (Deleted IDs) - MUST BE BEFORE /:id
router.get('/deleted', async (req, res) => {
    try {
        const deleted = await DeletedAnime.find().select('animeId');
        res.json(deleted.map(d => d.animeId));
    } catch (err) {
        console.error('[Anime] Get deleted anime error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Translate text to Indonesian
router.post('/translate', async (req, res) => {
    try {
        const { text, targetLang = 'id', sourceLang = 'auto' } = req.body;

        if (!text || text.trim() === '') {
            return res.json({ translated: '' });
        }

        console.log(`[Translate] Request: "${text.substring(0, 50)}..." => ${targetLang}`);
        const translated = await translateText(text, targetLang, sourceLang);

        res.json({ translated });
    } catch (err) {
        console.error('[Translate] Error:', err.message);
        res.status(500).json({ error: 'Translation failed', message: err.message });
    }
});

// Add Custom Anime
router.post('/', async (req, res) => {
    try {
        console.log('[POST /api/anime] Received data:', JSON.stringify(req.body, null, 2));

        // IMPORTANT: Remove from blacklist if it was previously deleted
        await DeletedAnime.deleteOne({ animeId: req.body.id });
        console.log('[POST /api/anime] Cleared from blacklist if existed:', req.body.id);

        // Check if anime already exists (by ID)
        const existingAnime = await CustomAnime.findOne({ id: req.body.id });
        if (existingAnime) {
            console.log('[POST /api/anime] Anime already exists, updating...');
            Object.assign(existingAnime, req.body);
            await existingAnime.save();
            console.log('[POST /api/anime] Successfully updated:', existingAnime.id);
            return res.json(existingAnime);
        }

        const newAnime = new CustomAnime(req.body);
        await newAnime.save();

        console.log('[POST /api/anime] Successfully saved:', newAnime.id);
        res.json(newAnime);
    } catch (err) {
        console.error('[POST /api/anime] ERROR:', err);
        console.error('[POST /api/anime] Error message:', err.message);
        console.error('[POST /api/anime] Error stack:', err.stack);

        res.status(500).json({
            error: 'Server error',
            message: err.message,
            details: err.errors || {}
        });
    }
});

// Get Single Anime (Custom or Scraped fallback)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Try DB first (Custom Anime)
        const anime = await CustomAnime.findOne({ id: id });
        if (anime) {
            return res.json(anime);
        }

        // 2. Try Scrapers Fallback
        console.log(`[API] Anime ${id} not found in DB, trying scrapers...`);

        // A. Check if it looks like NontonAnimeID slug (or just try it)
        try {
            // Nonton URL: base/anime/slug/
            const nontonUrl = `https://s8.nontonanimeid.boats/anime/${id}/`;
            const nontonInfo = await nonton.getAnimeInfo(nontonUrl);

            if (nontonInfo && nontonInfo.title !== 'Unknown Title') {
                console.log(`[API] Found in NontonAnimeID: ${nontonInfo.title}`);
                return res.json({
                    id: id,
                    title: nontonInfo.title,
                    poster: nontonInfo.poster,
                    synopsis: nontonInfo.synopsis,
                    rating: nontonInfo.rating,
                    genres: nontonInfo.genres,
                    status: nontonInfo.status,
                    episodes: nontonInfo.episodes.length,
                    episodeList: nontonInfo.episodes,
                    isCustom: false,
                    source: 'nontonanimeid'
                });
            }
        } catch (e) {
            console.log('[API] Nonton fallback failed:', e.message);
        }

        // B. Check Otakudesu (TODO: If Otakudesu scraper provided metadata)
        // For now Otakudesu scraper lacks metadata, so we might skip or minimal return

        return res.status(404).json({ msg: 'Anime not found' });
    } catch (err) {
        console.error('[Anime] Get single anime error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Update Anime (Upsert: Create if not exists - overrides API data)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        console.log('[API PUT] Updating anime:', id);
        console.log('[API PUT] Updates received:', JSON.stringify(updates, null, 2));

        const updatedAnime = await CustomAnime.findOneAndUpdate(
            { id: id },
            { $set: { ...updates, id: id, isCustom: true } }, // Ensure ID matches and is marked custom
            { new: true, upsert: true } // Create if not exists
        );

        console.log('[API PUT] Updated successfully, episodeData count:', updatedAnime.episodeData?.length);

        res.json(updatedAnime);
    } catch (err) {
        console.error('[Anime] Update anime error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Delete Anime (Blacklist)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if it's already deleted (blacklisted)
        const existingBlacklist = await DeletedAnime.findOne({ animeId: id });
        if (!existingBlacklist) {
            const deleted = new DeletedAnime({ animeId: id });
            await deleted.save();
        }

        // Also remove from CustomAnime if exists (so it doesn't reappear if unblacklisted later, or just to clean up)
        await CustomAnime.findOneAndDelete({ id: id });

        res.json({ msg: 'Anime deleted' });
    } catch (err) {
        console.error('[Anime] Delete anime error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// ==== OTAKUDESU SCRAPER ENDPOINTS ====

// Get video streams for specific anime episode
router.get('/stream/:animeTitle/:episode', async (req, res) => {
    try {
        const { animeTitle, episode } = req.params;
        const episodeNumber = parseInt(episode);
        const server = req.query.server || 'otakudesu'; // Default to Otakudesu

        // 0. Check for Manual Streams in DB (Priority)
        try {
            const dbAnime = await CustomAnime.findOne({
                title: { $regex: new RegExp(`^${animeTitle}$`, 'i') }
            });

            if (dbAnime && dbAnime.episodeData) {
                const epData = dbAnime.episodeData.find(e => e.ep === episodeNumber);

                if (epData && epData.streams && epData.streams.length > 0) {
                    return res.json({
                        success: true,
                        streams: epData.streams,
                        server: 'Custom Update',
                        subtitle: epData.subtitle || null
                    });
                }
            }
        } catch (dbErr) {
            console.error('[API] DB Stream Check Error:', dbErr);
        }

        // === SERVER 2: OTAKUDESU (with fallback to NontonAnimeID) ===
        if (server === 'otakudesu' || server === 'server2') {
            const result = await otakudesu.getEpisodeVideo(animeTitle, episodeNumber);
            if (!result.success || !result.streams || result.streams.length === 0) {
                // Fallback to NontonAnimeID automatically
                console.log('[API] Otakudesu failed, automatically falling back to NontonAnimeID...');
                // Fall through to Server 1 logic below
            } else {
                return res.json(result);
            }
        }

        // === SERVER 1: NONTONANIMEID (Default/Fallback) ===
        // Also handles fallthrough from Server 2 if Otakudesu fails
        if (server === 'nontonanimeid' || server === 'server1' || server === 'server2' || server === 'otakudesu') {
            // Logic:
            // 1. Search anime by title in NontonAnimeID
            // 2. Get Episode List
            // 3. Find Episode
            // 4. Get Stream

            console.log(`[API] Searching NontonAnimeID for: ${animeTitle}`);
            const searchResults = await nonton.searchAnime(animeTitle);

            // Fallback: If search empty, try to guess slug from title
            if (searchResults.length === 0) {
                console.log(`[API] Search empty. Trying direct slug match for: ${animeTitle}`);
                const slug = animeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const directUrl = `https://s8.nontonanimeid.boats/anime/${slug}/`;

                // Verify existence by fetching info
                const checkInfo = await nonton.getAnimeInfo(directUrl);
                if (checkInfo && checkInfo.title !== 'Unknown Title') {
                    searchResults.push({
                        title: checkInfo.title,
                        url: directUrl,
                        source: 'nontonanimeid'
                    });
                }
            }

            if (searchResults.length === 0) {
                // Try cleaning title? e.g remove "Subtitle Indonesia"
                let cleanTitle = animeTitle.replace(/Subtitle Indonesia|Sub Indo/gi, '').trim();

                // Variation: "2nd Season" <-> "Season 2"
                if (cleanTitle.includes('2nd Season')) {
                    const varies = cleanTitle.replace('2nd Season', 'Season 2');
                    console.log(`[API] Retry search with variation: ${varies}`);
                    const vResults = await nonton.searchAnime(varies);
                    if (vResults.length > 0) searchResults.push(...vResults);
                } else if (cleanTitle.includes('Season 2')) {
                    const varies = cleanTitle.replace('Season 2', '2nd Season');
                    console.log(`[API] Retry search with variation: ${varies}`);
                    const vResults = await nonton.searchAnime(varies);
                    if (vResults.length > 0) searchResults.push(...vResults);
                }

                if (searchResults.length === 0 && cleanTitle !== animeTitle) {
                    console.log(`[API] Retry search with clean title: ${cleanTitle}`);
                    const retryResults = await nonton.searchAnime(cleanTitle);
                    if (retryResults.length > 0) {
                        searchResults.push(...retryResults);
                    }
                }
            }

            if (searchResults.length === 0) {
                return res.status(404).json({ error: 'Anime tidak ditemukan di Server 2' });
            }

            const animeUrl = searchResults[0].url;
            console.log(`[API] Found anime: ${searchResults[0].title}`);

            const info = await nonton.getAnimeInfo(animeUrl);
            if (!info || !info.episodes) {
                return res.status(404).json({ error: 'Gagal mengambil info anime dari Server 2' });
            }

            // Find episode
            const targetEp = info.episodes.find(ep => ep.number === episodeNumber);
            if (!targetEp) {
                const available = info.episodes.map(e => e.number).sort((a, b) => a - b);
                return res.status(404).json({
                    error: `Episode ${episodeNumber} tidak tersedia`,
                    availableEpisodes: available
                });
            }

            console.log(`[API] Found Episode: ${targetEp.url}`);
            const streams = await nonton.getVideoStreams(targetEp.url);

            return res.json({
                success: true,
                streams: streams,
                server: 'NontonAnimeID'
            });
        }

        // === SERVER 3: QUINIME ===
        if (server === 'quinime' || server === 'server3') {
            console.log(`[API] Trying Quinime for: ${animeTitle} Episode ${episodeNumber}`);

            const result = await quinime.getVideoByTitle(animeTitle, episodeNumber);

            if (!result.success || result.streams.length === 0) {
                console.log('[API] Quinime failed:', result.error || 'No streams found');
                return res.status(404).json({ error: result.error || 'Video tidak ditemukan di Quinime' });
            }

            return res.json({
                success: true,
                streams: result.streams,
                server: 'Quinime',
                pageUrl: result.pageUrl
            });
        }

        return res.status(400).json({ error: 'Server invalid' });

    } catch (err) {
        console.error('[API] Stream error:', err);
        res.status(500).json({ error: 'Failed to get video stream' });
    }
});

// Search anime on Otakudesu AND NontonAnimeID
router.get('/search-otaku/:query', async (req, res) => {
    try {
        const query = req.params.query;
        console.log(`[API] Searching for: ${query}`);

        // Run both scrapers in parallel
        const [otakuResults, nontonResults] = await Promise.allSettled([
            otakudesu.searchAnime(query),
            nonton.searchAnime(query)
        ]);

        const finalResults = [];

        // Process Otakudesu
        if (otakuResults.status === 'fulfilled') {
            finalResults.push(...otakuResults.value.map(r => ({ ...r, source: 'otakudesu' })));
        } else {
            console.error('[API] Otakudesu search failed:', otakuResults.reason);
        }

        // Process NontonAnimeID
        if (nontonResults.status === 'fulfilled') {
            finalResults.push(...nontonResults.value); // Already has source='nontonanimeid' and thumb
        } else {
            console.error('[API] NontonAnimeID search failed:', nontonResults.reason);
        }

        console.log(`[API] Search Results: ${finalResults.length} found`);
        res.json(finalResults);

    } catch (err) {
        console.error('[API] Search error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// ==== SCRAPE EPISODES FEATURE ====
// Scrape all episodes for an anime from available scrapers
// Optionally accepts a URL in request body for direct scraping
router.post('/scrape-episodes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { url, animeData } = req.body; // Optional: direct URL and anime data from frontend

        console.log(`[API] Scraping episodes for anime ID: ${id}`);
        if (url) console.log(`[API] Using direct URL: ${url}`);

        // 1. Find anime in database, or create if provided from frontend
        let anime = await CustomAnime.findOne({ id: id });

        if (!anime) {
            // Try to find by title if animeData provided
            if (animeData && animeData.title) {
                anime = await CustomAnime.findOne({
                    title: { $regex: new RegExp(`^${animeData.title}$`, 'i') }
                });
            }

            // If still not found and we have animeData, create the anime
            if (!anime && animeData) {
                console.log(`[API] Anime not found in DB, creating from frontend data...`);
                anime = new CustomAnime({
                    id: id,
                    title: animeData.title,
                    studio: animeData.studio || 'Unknown',
                    releasedYear: animeData.releasedYear || new Date().getFullYear(),
                    episodes: animeData.episodes || 0,
                    rating: animeData.rating || 0,
                    status: animeData.status || 'Ongoing',
                    synopsis: animeData.synopsis || '',
                    poster: animeData.poster || '',
                    genres: animeData.genres || [],
                    malId: animeData.malId,
                    tmdbId: animeData.tmdbId,
                    episodeData: [],
                    views: 0
                });
                await anime.save();
                console.log(`[API] Created anime: ${anime.title}`);
            }

            if (!anime) {
                return res.status(404).json({ error: 'Anime tidak ditemukan dan tidak ada data untuk membuat baru' });
            }
        }

        const animeTitle = anime.title;
        let scrapedEpisodes = [];
        let source = '';

        // 2. If URL is provided, use direct scraping
        if (url) {
            console.log(`[API] Direct scraping from URL: ${url}`);

            // Detect source from URL
            if (url.includes('nontonanimeid') || url.includes('nontonauto') || url.includes('boats')) {
                try {
                    const info = await nonton.getAnimeInfo(url);
                    if (info && info.episodes && info.episodes.length > 0) {
                        scrapedEpisodes = info.episodes.map(ep => ({
                            ep: ep.number,
                            episodeNumber: ep.number,
                            title: ep.title || `Episode ${ep.number}`,
                            slug: ep.slug || '',
                            url: ep.url || '',
                            releaseDate: ep.date || '',
                            streams: []
                        }));
                        source = 'NontonAnimeID (Direct URL)';
                        console.log(`[API] Found ${scrapedEpisodes.length} episodes from NontonAnimeID`);
                    }
                } catch (e) {
                    console.error('[API] NontonAnimeID direct scrape failed:', e.message);
                    return res.status(500).json({ error: 'NontonAnimeID gagal', message: e.message });
                }
            } else if (url.includes('otakudesu')) {
                try {
                    const info = await otakudesu.getAnimeInfo(url);
                    if (info && info.episodes && info.episodes.length > 0) {
                        scrapedEpisodes = info.episodes.map(ep => ({
                            ep: ep.number || ep.episodeNumber,
                            episodeNumber: ep.number || ep.episodeNumber,
                            title: ep.title || `Episode ${ep.number || ep.episodeNumber}`,
                            slug: ep.slug || '',
                            url: ep.url || '',
                            releaseDate: ep.date || '',
                            streams: []
                        }));
                        source = 'Otakudesu (Direct URL)';
                        console.log(`[API] Found ${scrapedEpisodes.length} episodes from Otakudesu`);
                    }
                } catch (e) {
                    console.error('[API] Otakudesu direct scrape failed:', e.message);
                    return res.status(500).json({ error: 'Otakudesu gagal', message: e.message });
                }
            } else {
                return res.status(400).json({
                    error: 'URL tidak dikenali. Gunakan URL dari NontonAnimeID atau Otakudesu.'
                });
            }
        } else {
            // 3. Auto-search mode (original behavior)
            console.log(`[API] Searching scrapers for: ${animeTitle}`);
            try {
                console.log('[API] Trying NontonAnimeID...');
                const searchResults = await nonton.searchAnime(animeTitle);

                if (searchResults.length > 0) {
                    const info = await nonton.getAnimeInfo(searchResults[0].url);
                    if (info && info.episodes && info.episodes.length > 0) {
                        scrapedEpisodes = info.episodes.map(ep => ({
                            ep: ep.number,
                            episodeNumber: ep.number,
                            title: ep.title || `Episode ${ep.number}`,
                            slug: ep.slug || '',
                            url: ep.url || '',
                            releaseDate: ep.date || '',
                            streams: []
                        }));
                        source = 'NontonAnimeID';
                        console.log(`[API] Found ${scrapedEpisodes.length} episodes from NontonAnimeID`);
                    }
                }
            } catch (e) {
                console.error('[API] NontonAnimeID scrape failed:', e.message);
            }

            // 3. If NontonAnimeID failed, try Otakudesu
            if (scrapedEpisodes.length === 0) {
                try {
                    console.log('[API] Trying Otakudesu...');
                    const searchResults = await otakudesu.searchAnime(animeTitle);

                    if (searchResults.length > 0) {
                        const info = await otakudesu.getAnimeInfo(searchResults[0].url);
                        if (info && info.episodes && info.episodes.length > 0) {
                            scrapedEpisodes = info.episodes.map(ep => ({
                                ep: ep.number || ep.episodeNumber,
                                episodeNumber: ep.number || ep.episodeNumber,
                                title: ep.title || `Episode ${ep.number || ep.episodeNumber}`,
                                slug: ep.slug || '',
                                url: ep.url || '',
                                releaseDate: ep.date || '',
                                streams: []
                            }));
                            source = 'Otakudesu';
                            console.log(`[API] Found ${scrapedEpisodes.length} episodes from Otakudesu`);
                        }
                    }
                } catch (e) {
                    console.error('[API] Otakudesu scrape failed:', e.message);
                }
            }
        } // Close else block for auto-search mode

        // 4. Check if any episodes were found
        if (scrapedEpisodes.length === 0) {
            return res.status(404).json({
                error: 'Tidak ada episode yang ditemukan',
                hint: 'Coba gunakan URL langsung dari NontonAnimeID atau Otakudesu untuk akurasi lebih baik.'
            });
        }

        // 5. Merge with existing episodes (keep manual streams)
        const existingEpisodes = anime.episodeData || [];
        const mergedEpisodes = scrapedEpisodes.map(scraped => {
            const existing = existingEpisodes.find(e => e.ep === scraped.ep);
            if (existing && existing.streams && existing.streams.length > 0) {
                // Keep existing manual streams
                return { ...scraped, streams: existing.streams };
            }
            return scraped;
        });

        // 6. Update anime in database
        anime.episodeData = mergedEpisodes;
        anime.episodes = mergedEpisodes.length;
        await anime.save();

        console.log(`[API] Saved ${mergedEpisodes.length} episodes to database`);

        res.json({
            success: true,
            source: source,
            episodesCount: mergedEpisodes.length,
            episodes: mergedEpisodes,
            message: `Berhasil scrape ${mergedEpisodes.length} episode dari ${source}`
        });

    } catch (err) {
        console.error('[API] Scrape episodes error:', err);
        res.status(500).json({ error: 'Gagal scrape episode', message: err.message });
    }
});

// ==================== TRENDING & VIEW TRACKING ====================

// GET /api/anime/trending/weekly - Get trending anime based on weekly views
router.get('/trending/weekly', async (req, res) => {
    try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Aggregate views from the past 7 days
        const trendingData = await ViewHistory.aggregate([
            { $match: { date: { $gte: weekAgo } } },
            { $group: { _id: '$animeId', weeklyViews: { $sum: 1 } } },
            { $sort: { weeklyViews: -1 } },
            { $limit: 10 }
        ]);

        // Get anime details for trending
        const animeIds = trendingData.map(t => t._id);
        const animeList = await CustomAnime.find({ id: { $in: animeIds } });

        // Map with weekly views count
        const trending = trendingData.map(t => {
            const anime = animeList.find(a => a.id === t._id);
            if (!anime) return null;
            return {
                ...anime.toObject(),
                weeklyViews: t.weeklyViews
            };
        }).filter(Boolean);

        res.json(trending);
    } catch (err) {
        console.error('[API] Get trending error:', err);
        res.status(500).json({ error: 'Failed to get trending', message: err.message });
    }
});

// POST /api/anime/:id/view - Track a view for an anime
router.post('/:id/view', async (req, res) => {
    try {
        const { id } = req.params;
        const now = new Date();
        const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD

        // Record view in history
        await ViewHistory.create({
            animeId: id,
            date: now,
            dateString: dateString
        });

        // Also increment total views counter on anime
        await CustomAnime.findOneAndUpdate(
            { id: id },
            { $inc: { views: 1 } }
        );

        res.json({ success: true });
    } catch (err) {
        console.error('[API] Track view error:', err);
        res.status(500).json({ error: 'Failed to track view' });
    }
});

// ==================== SUBTITLE GENERATION ====================

// Check if subtitle generation is available
router.get('/subtitle/status', async (req, res) => {
    try {
        const hasFFmpeg = await checkFFmpeg();
        const hasOpenAI = !!process.env.OPENAI_API_KEY;

        res.json({
            available: hasFFmpeg,
            ffmpeg: hasFFmpeg,
            openai: hasOpenAI,
            local: hasFFmpeg, // Local whisper needs FFmpeg
            defaultProvider: process.env.WHISPER_PROVIDER || 'openai'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate subtitle for an episode
router.post('/:id/episode/:ep/generate-subtitle', async (req, res) => {
    try {
        const { id, ep } = req.params;
        const {
            provider = 'openai',
            language = null,
            translate = false,
            model = 'base'
        } = req.body;

        console.log(`[Subtitle] Generating for ${id} episode ${ep} using ${provider}...`);

        // Find the anime
        const anime = await CustomAnime.findOne({ id });
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }

        // Find the episode
        const episode = anime.episodeData?.find(e => e.ep === parseInt(ep));
        if (!episode) {
            return res.status(404).json({ error: 'Episode not found' });
        }

        // Get video URL from streams
        const directStream = episode.streams?.find(s => s.type === 'direct');
        if (!directStream) {
            return res.status(400).json({
                error: 'No direct video stream found. Subtitle generation requires a direct video file.'
            });
        }

        // Generate subtitle
        const result = await generateSubtitle(directStream.url, {
            provider,
            language,
            translate,
            model
        });

        // Upload VTT to R2
        const vttFileName = `subtitles/${id}/ep${ep}_${result.language || 'auto'}.vtt`;
        const vttBuffer = Buffer.from(result.vttContent, 'utf-8');

        const uploadResult = await uploadToR2(vttBuffer, vttFileName, 'text/vtt');

        // Update episode with subtitle info
        const epIndex = anime.episodeData.findIndex(e => e.ep === parseInt(ep));
        if (epIndex !== -1) {
            anime.episodeData[epIndex].subtitle = {
                url: uploadResult.url,
                language: result.language || 'auto',
                provider: provider,
                generatedAt: new Date()
            };
            await anime.save();
        }

        res.json({
            success: true,
            subtitle: {
                url: uploadResult.url,
                language: result.language,
                duration: result.duration,
                segmentCount: result.segmentCount,
                provider: result.provider
            }
        });

    } catch (err) {
        console.error('[Subtitle] Generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get subtitle for an episode
router.get('/:id/episode/:ep/subtitle', async (req, res) => {
    try {
        const { id, ep } = req.params;

        const anime = await CustomAnime.findOne({ id });
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }

        const episode = anime.episodeData?.find(e => e.ep === parseInt(ep));
        if (!episode || !episode.subtitle) {
            return res.status(404).json({ error: 'Subtitle not found' });
        }

        res.json(episode.subtitle);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete subtitle for an episode
router.delete('/:id/episode/:ep/subtitle', async (req, res) => {
    try {
        const { id, ep } = req.params;

        const anime = await CustomAnime.findOne({ id });
        if (!anime) {
            return res.status(404).json({ error: 'Anime not found' });
        }

        const epIndex = anime.episodeData.findIndex(e => e.ep === parseInt(ep));
        if (epIndex === -1) {
            return res.status(404).json({ error: 'Episode not found' });
        }

        anime.episodeData[epIndex].subtitle = undefined;
        await anime.save();

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

