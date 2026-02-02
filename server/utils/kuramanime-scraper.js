/**
 * Kuramanime Scraper Utility
 * Scrapes anime data and video streams from Kuramanime (v11.kuramanime.tel)
 */

const BASE_URL = 'https://v11.kuramanime.tel';

/**
 * Search anime by title
 */
async function searchAnime(query) {
    try {
        const searchUrl = `${BASE_URL}/anime?search=${encodeURIComponent(query)}&order_by=popular`;
        console.log(`[Kuramanime] Search URL: ${searchUrl}`);

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });
        const html = await response.text();
        console.log(`[Kuramanime] Response length: ${html.length}`);

        const results = [];

        // Step 1: Find all anime URLs with pattern /anime/{id}/{slug}
        const urlRegex = /href="\/anime\/(\d+)\/([a-z0-9-]+)"/gi;
        const foundUrls = new Map();

        let urlMatch;
        while ((urlMatch = urlRegex.exec(html)) !== null) {
            const id = urlMatch[1];
            const slug = urlMatch[2];
            // Skip episode links
            if (!urlMatch[0].includes('/episode/')) {
                foundUrls.set(id, slug);
            }
        }

        console.log(`[Kuramanime] Found ${foundUrls.size} unique anime URLs`);

        // Step 2: For each found URL, create result entry
        for (const [id, slug] of foundUrls) {
            // Skip certain system URLs
            if (slug.includes('setting') || slug.includes('login') || slug.includes('register')) continue;

            // Create nice title from slug
            const title = slug
                .replace(/-/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());

            results.push({
                id,
                slug,
                title,
                poster: '', // Will be fetched when needed
                url: `${BASE_URL}/anime/${id}/${slug}`
            });
        }

        return results;
    } catch (error) {
        console.error('[Kuramanime] Search error:', error);
        return [];
    }
}

/**
 * Get ongoing anime list
 */
async function getOngoingAnime(page = 1) {
    try {
        const url = `${BASE_URL}/quick/ongoing?order_by=updated&page=${page}`;
        const response = await fetch(url);
        const html = await response.text();

        return parseAnimeList(html);
    } catch (error) {
        console.error('[Kuramanime] Get ongoing error:', error);
        return [];
    }
}

/**
 * Get completed anime list
 */
async function getCompletedAnime(page = 1) {
    try {
        const url = `${BASE_URL}/quick/finished?order_by=updated&page=${page}`;
        const response = await fetch(url);
        const html = await response.text();

        return parseAnimeList(html);
    } catch (error) {
        console.error('[Kuramanime] Get completed error:', error);
        return [];
    }
}

/**
 * Parse anime list from HTML
 */
function parseAnimeList(html) {
    const results = [];

    // Match anime cards with poster, title, episode info, and rating
    const cardRegex = /href="\/anime\/(\d+)\/([^"]+)"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?(?:<h5[^>]*>([^<]+)<\/h5>|class="[^"]*anime-title[^"]*"[^>]*>([^<]+)<)/gi;
    let match;

    while ((match = cardRegex.exec(html)) !== null) {
        const id = match[1];
        const slug = match[2];
        const poster = match[3];
        const title = (match[4] || match[5] || '').trim();

        if (title && !results.find(r => r.id === id)) {
            results.push({
                id,
                slug,
                title,
                poster: poster.startsWith('http') ? poster : `${BASE_URL}${poster}`,
                url: `${BASE_URL}/anime/${id}/${slug}`
            });
        }
    }

    return results;
}

/**
 * Get anime details
 */
async function getAnimeInfo(animeId, slug) {
    try {
        const url = `${BASE_URL}/anime/${animeId}/${slug}`;
        const response = await fetch(url);
        const html = await response.text();

        const info = {
            id: animeId,
            slug,
            url
        };

        // Extract title
        const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (titleMatch) info.title = titleMatch[1].trim();

        // Extract synopsis
        const synopsisMatch = html.match(/<p[^>]*class="[^"]*synopsis[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        if (synopsisMatch) info.synopsis = synopsisMatch[1].replace(/<[^>]+>/g, '').trim();

        // Extract poster
        const posterMatch = html.match(/<img[^>]+class="[^"]*anime-poster[^"]*"[^>]+src="([^"]+)"/i);
        if (posterMatch) info.poster = posterMatch[1];

        // Extract type
        const typeMatch = html.match(/Tipe:[\s\S]*?<a[^>]+>([^<]+)<\/a>/i);
        if (typeMatch) info.type = typeMatch[1].trim();

        // Extract episode count
        const epMatch = html.match(/Episode:[\s\S]*?<a[^>]+>(\d+)<\/a>/i);
        if (epMatch) info.episodes = parseInt(epMatch[1]);

        // Extract status
        const statusMatch = html.match(/Status:[\s\S]*?<a[^>]+>([^<]+)<\/a>/i);
        if (statusMatch) info.status = statusMatch[1].trim();

        // Extract rating/score
        const scoreMatch = html.match(/Skor:[\s\S]*?<a[^>]+>([0-9.]+)/i);
        if (scoreMatch) info.score = parseFloat(scoreMatch[1]);

        // Extract genres
        const genreRegex = /Genre:[\s\S]*?(<a[^>]+>[^<]+<\/a>[\s,]*)+/i;
        const genreMatch = html.match(genreRegex);
        if (genreMatch) {
            const genres = [];
            const genreLinkRegex = /<a[^>]+href="[^"]*genre[^"]*"[^>]*>([^<]+)<\/a>/gi;
            let genreLink;
            while ((genreLink = genreLinkRegex.exec(genreMatch[0])) !== null) {
                genres.push(genreLink[1].replace(/,/g, '').trim());
            }
            info.genres = genres;
        }

        // Extract studio
        const studioMatch = html.match(/Studio:[\s\S]*?<a[^>]+>([^<]+)<\/a>/i);
        if (studioMatch) info.studio = studioMatch[1].trim();

        // Extract season
        const seasonMatch = html.match(/Musim:[\s\S]*?<a[^>]+>([^<]+)<\/a>/i);
        if (seasonMatch) info.season = seasonMatch[1].trim();

        return info;
    } catch (error) {
        console.error('[Kuramanime] Get anime info error:', error);
        return null;
    }
}

/**
 * Get episode list for an anime
 */
async function getEpisodes(animeId, slug) {
    try {
        const url = `${BASE_URL}/anime/${animeId}/${slug}`;
        const response = await fetch(url);
        const html = await response.text();

        const episodes = [];

        // Match episode links: /anime/{id}/{slug}/episode/{num}
        const epRegex = /href="\/anime\/\d+\/[^"]+\/episode\/(\d+)"/gi;
        let match;

        while ((match = epRegex.exec(html)) !== null) {
            const epNum = parseInt(match[1]);
            if (!episodes.includes(epNum)) {
                episodes.push(epNum);
            }
        }

        return episodes.sort((a, b) => a - b);
    } catch (error) {
        console.error('[Kuramanime] Get episodes error:', error);
        return [];
    }
}

/**
 * Get video streams for a specific episode
 */
async function getEpisodeVideo(animeId, slug, episodeNumber) {
    try {
        const url = `${BASE_URL}/anime/${animeId}/${slug}/episode/${episodeNumber}`;
        console.log(`[Kuramanime] Fetching: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': BASE_URL
            }
        });
        const html = await response.text();

        const streams = [];

        // Extract iframe sources (video embeds)
        const iframeRegex = /<iframe[^>]+src="([^"]+)"/gi;
        let iframeMatch;

        while ((iframeMatch = iframeRegex.exec(html)) !== null) {
            let embedUrl = iframeMatch[1];
            // Make sure URL is absolute
            if (embedUrl.startsWith('//')) {
                embedUrl = 'https:' + embedUrl;
            } else if (!embedUrl.startsWith('http')) {
                embedUrl = BASE_URL + embedUrl;
            }

            streams.push({
                url: embedUrl,
                quality: 'auto',
                server: 'Kuramanime',
                type: 'embed'
            });
        }

        // Extract download links if available
        // Pattern: <a href="download_url" class="download-link">Quality</a>
        const downloadRegex = /<a[^>]+href="([^"]+)"[^>]*class="[^"]*download[^"]*"[^>]*>([^<]*(\d+p)[^<]*)<\/a>/gi;
        let downloadMatch;

        while ((downloadMatch = downloadRegex.exec(html)) !== null) {
            let downloadUrl = downloadMatch[1];
            const quality = downloadMatch[3] || '720p';

            if (downloadUrl.startsWith('//')) {
                downloadUrl = 'https:' + downloadUrl;
            }

            streams.push({
                url: downloadUrl,
                quality,
                server: 'Kuramanime Download',
                type: 'download'
            });
        }

        // Try to extract video URL from script tags (sometimes inline)
        const scriptRegex = /source:\s*['"](https?:\/\/[^'"]+)['"]/gi;
        let scriptMatch;

        while ((scriptMatch = scriptRegex.exec(html)) !== null) {
            streams.push({
                url: scriptMatch[1],
                quality: 'auto',
                server: 'Kuramanime Direct',
                type: 'stream'
            });
        }

        return {
            success: streams.length > 0,
            anime: slug.replace(/-/g, ' '),
            episode: episodeNumber,
            streams,
            pageUrl: url
        };
    } catch (error) {
        console.error('[Kuramanime] Get episode video error:', error);
        return {
            success: false,
            error: error.message,
            streams: []
        };
    }
}

/**
 * Main function: Search and get video for specific anime episode
 */
async function getVideoByTitle(animeTitle, episodeNumber) {
    try {
        console.log(`[Kuramanime] Searching: ${animeTitle}`);

        // 1. Search anime
        const searchResults = await searchAnime(animeTitle);

        if (searchResults.length === 0) {
            // Try simplified search
            const simplifiedTitle = animeTitle.split(' ').slice(0, 2).join(' ');
            console.log(`[Kuramanime] Retrying with: ${simplifiedTitle}`);
            const retryResults = await searchAnime(simplifiedTitle);

            if (retryResults.length === 0) {
                throw new Error('Anime not found');
            }

            const anime = retryResults[0];
            console.log(`[Kuramanime] Found: ${anime.title}`);
            return await getEpisodeVideo(anime.id, anime.slug, episodeNumber);
        }

        const anime = searchResults[0];
        console.log(`[Kuramanime] Found: ${anime.title}`);

        // 2. Get video streams
        return await getEpisodeVideo(anime.id, anime.slug, episodeNumber);

    } catch (error) {
        console.error('[Kuramanime] Error:', error);
        return {
            success: false,
            error: error.message,
            streams: []
        };
    }
}

module.exports = {
    searchAnime,
    getOngoingAnime,
    getCompletedAnime,
    getAnimeInfo,
    getEpisodes,
    getEpisodeVideo,
    getVideoByTitle
};
