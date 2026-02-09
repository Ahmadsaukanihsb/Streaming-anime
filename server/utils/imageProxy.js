/**
 * Image Proxy Utility
 * Downloads images from external sources (like MAL) and caches them to Cloudflare R2
 * This improves LCP by serving images from R2 CDN instead of external sources
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// Initialize R2 client
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// Use the main bucket for images
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'streaminganime';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// Allowed image sources (whitelist for security)
const ALLOWED_SOURCES = [
    'cdn.myanimelist.net',
    'img1.ak.crunchyroll.com',
    's4.anilist.co',
    'artworks.thetvdb.com',
    'image.tmdb.org',
];

/**
 * Generate a hash key for the image URL
 * @param {string} url - Original image URL
 * @returns {string} - Hash key
 */
function getImageKey(url) {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const extension = getImageExtension(url);
    return `images/cache/${hash}${extension}`;
}

/**
 * Get image extension from URL
 * @param {string} url - Image URL
 * @returns {string} - Extension with dot (e.g., '.jpg')
 */
function getImageExtension(url) {
    try {
        const pathname = new URL(url).pathname;
        const ext = pathname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i);
        return ext ? ext[0].toLowerCase() : '.jpg';
    } catch {
        return '.jpg';
    }
}

/**
 * Get content type from extension
 * @param {string} extension - File extension
 * @returns {string} - MIME type
 */
function getContentType(extension) {
    const types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.avif': 'image/avif',
    };
    return types[extension] || 'image/jpeg';
}

/**
 * Check if image source is allowed
 * @param {string} url - Image URL
 * @returns {boolean} - Whether source is allowed
 */
function isAllowedSource(url) {
    try {
        const hostname = new URL(url).hostname;
        return ALLOWED_SOURCES.some(source => hostname.includes(source));
    } catch {
        return false;
    }
}

/**
 * Check if image exists in R2
 * @param {string} key - Image key in R2
 * @returns {Promise<boolean>} - Whether image exists
 */
async function imageExistsInR2(key) {
    try {
        await r2Client.send(new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        }));
        return true;
    } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        console.error('[ImageProxy] Error checking R2:', error.message);
        return false;
    }
}

/**
 * Download image from source and upload to R2
 * @param {string} url - Original image URL
 * @param {string} key - R2 key to store image
 * @returns {Promise<Buffer|null>} - Image buffer or null on failure
 */
async function downloadAndCacheImage(url, key) {
    try {
        console.log(`[ImageProxy] Downloading: ${url}`);

        // Download image
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*',
            },
        });

        if (!response.ok) {
            console.error(`[ImageProxy] Failed to download: ${response.status}`);
            return null;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || getContentType(getImageExtension(url));

        // Upload to R2
        await r2Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000', // Cache for 1 year
        }));

        console.log(`[ImageProxy] Cached to R2: ${key}`);
        return buffer;
    } catch (error) {
        console.error('[ImageProxy] Download/upload error:', error.message);
        return null;
    }
}

/**
 * Get cached image URL from R2
 * @param {string} originalUrl - Original image URL
 * @returns {string} - R2 URL or original URL if not cacheable
 */
function getCachedImageUrl(originalUrl) {
    if (!originalUrl || !isAllowedSource(originalUrl)) {
        return originalUrl;
    }

    const key = getImageKey(originalUrl);
    return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Process image - check cache and download if needed
 * @param {string} url - Original image URL
 * @returns {Promise<{url: string, buffer?: Buffer, fromCache: boolean}>}
 */
async function processImage(url) {
    if (!url || !isAllowedSource(url)) {
        return { url, fromCache: false };
    }

    const key = getImageKey(url);
    const cachedUrl = `${R2_PUBLIC_URL}/${key}`;

    // Check if already cached
    const exists = await imageExistsInR2(key);
    if (exists) {
        return { url: cachedUrl, fromCache: true };
    }

    // Download and cache
    const buffer = await downloadAndCacheImage(url, key);
    if (buffer) {
        return { url: cachedUrl, buffer, fromCache: false };
    }

    // Fallback to original URL if caching failed
    return { url, fromCache: false };
}

/**
 * Batch process multiple images
 * @param {string[]} urls - Array of image URLs
 * @returns {Promise<Map<string, string>>} - Map of original URL to cached URL
 */
async function batchProcessImages(urls) {
    const results = new Map();
    const uniqueUrls = [...new Set(urls.filter(url => url && isAllowedSource(url)))];

    // Process in parallel with concurrency limit
    const BATCH_SIZE = 5;
    for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
        const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (url) => {
            const result = await processImage(url);
            results.set(url, result.url);
        });
        await Promise.all(promises);
    }

    return results;
}

module.exports = {
    getImageKey,
    isAllowedSource,
    imageExistsInR2,
    downloadAndCacheImage,
    getCachedImageUrl,
    processImage,
    batchProcessImages,
    ALLOWED_SOURCES,
};
