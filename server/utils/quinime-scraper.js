/**
 * Quinime Scraper Utility
 * Scrapes anime data and download links from Quinime (quinime.my.id)
 */

const BASE_URL = 'https://quinime.my.id';

/**
 * Search anime by title
 */
async function searchAnime(query) {
    try {
        // Quinime uses WordPress, search via /?s=query
        const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
        console.log(`[Quinime] Searching: ${searchUrl}`);

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const html = await response.text();

        const results = [];
        const foundSlugs = new Set();

        // Quinime search returns episode links, extract slug from them
        // Pattern: /{anime-slug}-episode-{num}/
        const episodeRegex = /href="https?:\/\/quinime\.my\.id\/([^"\/]+)-episode-(\d+)\/?"/gi;
        let match;

        while ((match = episodeRegex.exec(html)) !== null) {
            const slug = match[1];
            const episode = parseInt(match[2]);

            // Skip if already found this slug
            if (foundSlugs.has(slug)) continue;
            foundSlugs.add(slug);

            // Create title from slug
            const title = slug
                .replace(/-/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());

            results.push({
                slug,
                title,
                url: `${BASE_URL}/anime/${slug}/`,
                latestEpisode: episode
            });
        }

        console.log(`[Quinime] Found ${results.length} anime from search`);
        return results;
    } catch (error) {
        console.error('[Quinime] Search error:', error);
        return [];
    }
}

/**
 * Get anime info and episode list
 */
async function getAnimeInfo(slug) {
    try {
        const url = `${BASE_URL}/anime/${slug}/`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const html = await response.text();

        const info = { slug, url };

        // Extract title
        const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
            html.match(/<title>([^<]+)/i);
        if (titleMatch) {
            info.title = titleMatch[1].replace(' – Quinime', '').trim();
        }

        // Extract episodes
        const episodes = [];
        // Pattern: /{slug}-episode-{num}/
        const epRegex = new RegExp(`href="[^"]*/${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-episode-(\\d+)/?[^"]*"`, 'gi');
        let epMatch;

        while ((epMatch = epRegex.exec(html)) !== null) {
            const epNum = parseInt(epMatch[1]);
            if (!episodes.includes(epNum)) {
                episodes.push(epNum);
            }
        }

        info.episodes = episodes.sort((a, b) => a - b);
        info.totalEpisodes = episodes.length;

        return info;
    } catch (error) {
        console.error('[Quinime] Get anime info error:', error);
        return null;
    }
}

/**
 * Get download/stream links for a specific episode
 */
async function getEpisodeStreams(slug, episodeNumber) {
    try {
        // Format episode number with leading zero if needed
        const epNum = episodeNumber.toString().padStart(2, '0');
        const url = `${BASE_URL}/${slug}-episode-${epNum}/`;

        console.log(`[Quinime] Fetching episode: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            // Try without leading zero
            const altUrl = `${BASE_URL}/${slug}-episode-${episodeNumber}/`;
            console.log(`[Quinime] Trying alternative URL: ${altUrl}`);
            const altResponse = await fetch(altUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (!altResponse.ok) {
                throw new Error(`Episode not found: ${response.status}`);
            }
            var html = await altResponse.text();
        } else {
            var html = await response.text();
        }

        const streams = [];

        // Extract quality sections and their links
        // Using direct link extraction with quality detection

        // Method 2: Direct link extraction with quality detection
        const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        let linkMatch;

        // Track which quality we're currently in
        let currentQuality = 'unknown';
        const lines = html.split('\n');

        for (const line of lines) {
            // Detect quality header
            const qualityMatch = line.match(/\[(\d+p)\]/i);
            if (qualityMatch) {
                currentQuality = qualityMatch[1];
            }

            // Extract links from this line
            const lineLinkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            let match;
            while ((match = lineLinkRegex.exec(line)) !== null) {
                const linkUrl = match[1];
                const linkText = match[2].trim();

                // Filter for download hosts
                const isDownloadHost =
                    linkUrl.includes('terabox') ||
                    linkUrl.includes('gofile') ||
                    linkUrl.includes('mir.cr') ||
                    linkUrl.includes('mirrorcreators') ||
                    linkUrl.includes('mediafire') ||
                    linkUrl.includes('mega.nz') ||
                    linkUrl.includes('drive.google');

                if (isDownloadHost) {
                    // Determine quality from context
                    let quality = currentQuality;
                    if (linkUrl.includes('1080') || line.includes('1080p')) quality = '1080p';
                    else if (linkUrl.includes('720') || line.includes('720p')) quality = '720p';
                    else if (linkUrl.includes('480') || line.includes('480p')) quality = '480p';

                    streams.push({
                        url: linkUrl,
                        quality: quality,
                        server: linkText,
                        type: 'download'
                    });
                }
            }
        }

        // Deduplicate streams
        const uniqueStreams = streams.filter((stream, index, self) =>
            index === self.findIndex(s => s.url === stream.url)
        );

        return {
            success: uniqueStreams.length > 0,
            anime: slug.replace(/-/g, ' '),
            episode: episodeNumber,
            streams: uniqueStreams,
            pageUrl: url
        };
    } catch (error) {
        console.error('[Quinime] Get episode streams error:', error);
        return {
            success: false,
            error: error.message,
            streams: []
        };
    }
}

/**
 * Main function: Search and get episode streams by title
 */
async function getVideoByTitle(animeTitle, episodeNumber) {
    try {
        console.log(`[Quinime] Getting video for: ${animeTitle} Episode ${episodeNumber}`);

        // Clean title for search
        const cleanTitle = animeTitle
            .replace(/[^\w\s]/g, ' ')  // Remove special chars
            .replace(/\s+/g, ' ')       // Normalize spaces
            .trim();

        const words = cleanTitle.split(' ').filter(w => w.length > 0);

        // Try multiple search strategies
        const searchStrategies = [
            cleanTitle,                                    // Full clean title
            words.slice(0, 3).join(' '),                   // First 3 words
            words.slice(0, 2).join(' '),                   // First 2 words
            words[0],                                      // First word only
            animeTitle.split(':')[0].trim(),               // Before colon
            animeTitle.split(' - ')[0].trim(),             // Before dash
        ].filter(s => s && s.length > 2);

        // Remove duplicates
        const uniqueStrategies = [...new Set(searchStrategies)];

        let anime = null;

        for (const searchTerm of uniqueStrategies) {
            console.log(`[Quinime] Trying search: "${searchTerm}"`);
            const results = await searchAnime(searchTerm);

            if (results.length > 0) {
                // Try to find best match
                anime = results.find(r =>
                    r.title.toLowerCase().includes(words[0].toLowerCase())
                ) || results[0];

                console.log(`[Quinime] Found: ${anime.title} (${anime.slug})`);
                break;
            }
        }

        if (!anime) {
            return {
                success: false,
                error: `Anime "${animeTitle}" tidak ditemukan di Quinime`,
                streams: []
            };
        }

        // Get episode streams
        return await getEpisodeStreams(anime.slug, episodeNumber);

    } catch (error) {
        console.error('[Quinime] Error:', error);
        return {
            success: false,
            error: error.message,
            streams: []
        };
    }
}

/**
 * Get latest releases from homepage
 */
async function getLatestReleases() {
    try {
        const response = await fetch(BASE_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const html = await response.text();

        const releases = [];
        // Match episode links from homepage
        const epRegex = /href="https?:\/\/quinime\.my\.id\/([^"\/]+-episode-\d+)\/?"/gi;
        let match;

        while ((match = epRegex.exec(html)) !== null) {
            const fullSlug = match[1];
            const parts = fullSlug.match(/(.+)-episode-(\d+)$/);
            if (parts) {
                releases.push({
                    slug: parts[1],
                    episode: parseInt(parts[2]),
                    url: `${BASE_URL}/${fullSlug}/`
                });
            }
        }

        return releases;
    } catch (error) {
        console.error('[Quinime] Get latest error:', error);
        return [];
    }
}

module.exports = {
    searchAnime,
    getAnimeInfo,
    getEpisodeStreams,
    getVideoByTitle,
    getLatestReleases
};
