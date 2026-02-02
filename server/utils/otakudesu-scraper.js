/**
 * Otakudesu Scraper Utility
 * Scrapes anime data and video streams from Otakudesu.cloud
 */

const BASE_URL = 'https://otakudesu.best';

/**
 * Search anime by title
 */
async function searchAnime(query) {
    try {
        // 1. Try search with full query
        let results = await performSearch(query);

        // 2. If no results, try searching with simplified query (first 2 words)
        // Only if query has more than 2 words
        if (results.length === 0 && query.split(' ').length > 2) {
            const simplifiedQuery = query.split(' ').slice(0, 2).join(' ');
            console.log(`[Otakudesu] Search failed, retrying with: ${simplifiedQuery}`);
            results = await performSearch(simplifiedQuery);
        }

        // 3. Fallback: Try even simpler (first word) if still failed and had > 2 words
        if (results.length === 0 && query.split(' ').length > 2) {
            const firstWord = query.split(' ')[0];
            // Ensure first word is long enough to be meaningful (>3 chars)
            if (firstWord.length > 3) {
                console.log(`[Otakudesu] Search failed, retrying with: ${firstWord}`);
                results = await performSearch(firstWord);
            }
        }

        // Filter results specifically for the requested anime if we did a broad search
        // (optional: simple fuzzy match or just return all)
        return results;

    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

async function performSearch(query) {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`;
    console.log(`[Otakudesu] Searching URL: ${searchUrl}`);

    const response = await fetch(searchUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    const html = await response.text();

    const results = [];

    // New format: ## [Title](url) or - [Title](url)
    // Pattern matches: <a href="URL">TITLE Subtitle Indonesia</a>
    // Found in h2 or list items
    const regex = /<a href="(https?:\/\/otakudesu\.best\/anime\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
        const url = match[1];
        const title = match[2].trim();

        // Skip duplicate entries and genre links
        if (url.includes('/genres/') || url.includes('/tag/')) continue;

        // Extract slug from URL
        const slug = url.split('/').filter(Boolean).pop();

        // Avoid duplicates
        if (!results.find(r => r.slug === slug)) {
            results.push({
                url,
                title,
                slug,
                poster: '' // Will be fetched from anime page if needed
            });
        }
    }

    console.log(`[Otakudesu] Found ${results.length} results`);
    return results;
}

/**
 * Get anime details and episode list
 */
async function getAnimeInfo(slug) {
    try {
        const url = `${BASE_URL}/anime/${slug}/`;
        const response = await fetch(url);
        const html = await response.text();

        // Extract episode list
        const episodes = [];
        // Regex untuk match link episode: .../episode/...
        // Format text: "Judul Anime Episode X Subtitle Indonesia"
        // Update: Handle attributes like target="_blank" inside <a> tag
        const epRegex = /<a href="([^"]+)"[^>]*>.*?Episode\s+(\d+)/gi;
        let match;

        while ((match = epRegex.exec(html)) !== null) {
            episodes.push({
                number: parseInt(match[2]),
                url: match[1]
            });
        }

        return {
            slug,
            episodes: episodes.sort((a, b) => a.number - b.number)
        };
    } catch (error) {
        console.error('Get info error:', error);
        return { slug, episodes: [] };
    }
}

/**
 * Extract video URLs from episode page
 */
async function getVideoStreams(episodeUrl) {
    try {
        const response = await fetch(episodeUrl);
        const html = await response.text();

        const streams = [];

        // Extract download links (NEW LOGIC: Parse per <li> block)
        // Format: <li><strong>Mp4 720p</strong> <a href="...">Server1</a> <a href="...">Server2</a></li>
        const liRegex = /<li>\s*<strong>([^<]+)<\/strong>(.*?)<\/li>/gi;
        let liMatch;

        while ((liMatch = liRegex.exec(html)) !== null) {
            const resolutionText = liMatch[1]; // e.g., "Mp4 720p"
            const content = liMatch[2]; // e.g., <a href="...">...</a>

            let quality = '360p'; // default fallback
            if (resolutionText.includes('1080p')) quality = '1080p';
            else if (resolutionText.includes('720p')) quality = '720p';
            else if (resolutionText.includes('480p')) quality = '480p';
            else if (resolutionText.includes('360p')) quality = '360p';

            // Extract links from this block
            const linkRegex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            let linkMatch;

            while ((linkMatch = linkRegex.exec(content)) !== null) {
                const url = linkMatch[1];
                const server = linkMatch[2];

                streams.push({
                    url,
                    quality,
                    server,
                    type: 'download'
                });
            }
        }

        // Extract streaming embeds (iframe sources)
        const iframeRegex = /<iframe[^>]+src="([^"]+)"/gi;
        let iframeMatch;
        while ((iframeMatch = iframeRegex.exec(html)) !== null) {
            const embedUrl = iframeMatch[1];
            if (embedUrl.includes('desustream') || embedUrl.includes('otakudesu')) {
                streams.push({
                    url: embedUrl,
                    quality: 'auto',
                    server: 'Desustream',
                    type: 'embed'
                });
            }
        }

        return streams;
    } catch (error) {
        console.error('Get streams error:', error);
        return [];
    }
}

/**
 * Main function: Get video for specific anime episode
 */
async function getEpisodeVideo(animeTitle, episodeNumber) {
    try {
        // 1. Search  anime
        console.log(`[Otakudesu] Searching: ${animeTitle}`);
        const searchResults = await searchAnime(animeTitle);

        if (searchResults.length === 0) {
            throw new Error('Anime not found');
        }

        const anime = searchResults[0];
        console.log(`[Otakudesu] Found: ${anime.title}`);

        // 2. Get episode list
        const info = await getAnimeInfo(anime.slug);
        const episode = info.episodes.find(ep => ep.number === episodeNumber);

        if (!episode) {
            throw new Error(`Episode ${episodeNumber} not found`);
        }

        console.log(`[Otakudesu] Getting streams for Episode ${episodeNumber}`);

        // 3. Get video streams
        const streams = await getVideoStreams(episode.url);

        return {
            success: true,
            anime: anime.title,
            episode: episodeNumber,
            streams
        };
    } catch (error) {
        console.error('[Otakudesu] Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    searchAnime,
    getAnimeInfo,
    getVideoStreams,
    getEpisodeVideo
};
