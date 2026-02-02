const BASE_URL = 'https://s8.nontonanimeid.boats';

// Helper for headers
const getHeaders = () => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': BASE_URL,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
});

async function searchAnime(query) {
    try {
        const url = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
        const response = await fetch(url, { headers: getHeaders() });
        const html = await response.text();

        const results = [];
        // Regex untuk card anime
        // <a href="URL" class="as-anime-card" ...> ... <img src="IMG" ...> ... <h3 class="as-anime-title">TITLE</h3>
        const animeCardRegex = /<a href="([^"]+)" class="as-anime-card"[^>]*>[\s\S]*?<img src="([^"]+)"[^>]*>[\s\S]*?<h3 class="as-anime-title">([^<]+)<\/h3>/gi;

        let match;
        while ((match = animeCardRegex.exec(html)) !== null) {
            results.push({
                title: match[3].trim(),
                url: match[1],
                thumb: match[2],
                source: 'nontonanimeid'
            });
        }

        return results;

    } catch (error) {
        console.error('NontonAnimeID Search Error:', error);
        return [];
    }
}

async function fetchPage(url) {
    const response = await fetch(url, { headers: getHeaders() });
    return await response.text();
}

async function getAnimeInfo(animeUrl) {
    try {
        const html = await fetchPage(animeUrl);

        // --- METADATA (From Page 1) ---

        // Extract Title
        const titleMatch = /<h1 class="entry-title cs">([^<]+)<\/h1>/i.exec(html);
        const title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';

        // Extract Poster
        const posterMatch = /<div class="anime-card__sidebar">[\s\S]*?<img src="([^"]+)"/i.exec(html);
        const poster = posterMatch ? posterMatch[1] : '';

        // Extract Synopsis
        const synopsisMatch = /<div class="synopsis-prose">[\s\S]*?<p>([\s\S]*?)<\/p>/i.exec(html);
        const synopsis = synopsisMatch ? synopsisMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        // Extract Rating
        const ratingMatch = /<span class="value">([^<]+)<\/span>/i.exec(html);
        const rating = ratingMatch ? ratingMatch[1].trim() : '?';

        // Extract Status
        let status = 'Unknown';
        if (html.includes('Finished Airing')) status = 'Finished';
        else if (html.includes('Currently Airing') || html.includes('Ongoing')) status = 'Ongoing';

        // Extract Genres
        const genres = [];
        const genreRegex = /<a href="[^"]+\/genres\/[^"]+"[^>]*>([^<]+)<\/a>/gi;
        let genreMatch;
        while ((genreMatch = genreRegex.exec(html)) !== null) {
            genres.push(genreMatch[1].trim());
        }

        // --- EPISODES (Pagination Support) ---
        let allEpisodes = [];
        let currentPageHtml = html;
        let p = 1;

        while (true) {
            const episodes = [];
            // <a href="URL" class="episode-item" ...> <span class="ep-title">Episode X</span> ... </a>
            const episodeRegex = /<a href="([^"]+)" class="episode-item"[^>]*>[\s\S]*?<span class="ep-title">(Episode\s*\d+|Movie|OVA[^<]*)<\/span>[\s\S]*?<span class="ep-date">([^<]*)<\/span>/gi;

            let match;
            while ((match = episodeRegex.exec(currentPageHtml)) !== null) {
                const url = match[1];
                const epTitle = match[2].trim();
                const date = match[3].trim();

                const numberMatch = /(\d+)/.exec(epTitle);
                const number = numberMatch ? parseInt(numberMatch[1]) : 0;

                episodes.push({
                    title: epTitle,
                    url,
                    number,
                    date
                });
            }

            if (episodes.length === 0) break;

            allEpisodes.push(...episodes);
            console.log(`[Scraper] Page ${p} parsed: ${episodes.length} episodes`);

            // Check Next Page - Flexible Regex
            // 1. <a class="next page-numbers" href="...">
            // 2. <a href="..." class="next page-numbers">
            const nextMatch = /<a\s+[^>]*href="([^"]+)"[^>]*class="[^"]*next page-numbers[^"]*"/i.exec(currentPageHtml) ||
                /<a\s+[^>]*class="[^"]*next page-numbers[^"]*"[^>]*href="([^"]+)"/i.exec(currentPageHtml);

            if (nextMatch) {
                // Get URL from Group 1 or 2 (depending on regex hit)
                // Both regexes capture href in group 1 if structured correctly, but regex logic above:
                // Regex 1: href="..." -> group 1.
                // Regex 2: href="..." -> group 1.
                // So nextUrl is match[1].
                const nextUrl = nextMatch[1];

                console.log(`[Scraper] Fetching next page: ${nextUrl}`);
                try {
                    currentPageHtml = await fetchPage(nextUrl);
                    p++;
                } catch (e) {
                    console.error('[Scraper] Pagination error:', e);
                    break;
                }
            } else {
                console.log('[Scraper] No next page found.');
                break; // No more pages
            }

            // Safety break
            if (p > 10) break;
        }

        return {
            title,
            poster,
            synopsis,
            rating,
            genres,
            status,
            episodes: allEpisodes.reverse() // Sort 1..N
        };

    } catch (error) {
        console.error('NontonAnimeID Info Error:', error);
        return null;
    }
}

async function getVideoStreams(episodeUrl) {
    try {
        const response = await fetch(episodeUrl, { headers: getHeaders() });
        const html = await response.text();
        const streams = [];

        // 1. Extract Iframe Data-Src (Main Player)
        // <iframe ... data-src="URL" ... >
        const iframeRegex = /<iframe[^>]+data-src="([^"]+)"/i;
        const iframeMatch = iframeRegex.exec(html);

        if (iframeMatch) {
            streams.push({
                server: 'NontonAnimeID (Lokal)',
                url: iframeMatch[1],
                type: 'embed',
                quality: 'HD'
            });
        }

        // 2. Extract Download Links (Backup)
        const downloadRegex = /<div class="listlink">.*?<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        let dlMatch;
        while ((dlMatch = downloadRegex.exec(html)) !== null) {
            streams.push({
                server: dlMatch[2].trim(),
                url: dlMatch[1],
                type: 'download',
                quality: 'Unknown'
            });
        }

        return streams;

    } catch (error) {
        console.error('NontonAnimeID Stream Error:', error);
        return [];
    }
}

module.exports = {
    searchAnime,
    getAnimeInfo,
    getVideoStreams,
    fetchPage
};
