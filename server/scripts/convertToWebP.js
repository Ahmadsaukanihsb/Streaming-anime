/**
 * Convert Cached Images to WebP
 * 
 * This script converts all existing cached images to WebP format for better compression.
 * It re-downloads images and converts them using sharp.
 * 
 * Usage:
 *   npm run cache:webp         - Convert all images to WebP
 *   npm run cache:webp:dry     - Dry run (show what would be converted)
 *   npm run cache:webp:preview - Preview mode (convert first 10 only)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { CustomAnime } = require('../models/CustomAnime');
const {
    isAllowedSource,
    getImageKey,
    getLegacyImageKey,
    imageExistsInR2,
    downloadAndCacheImage,
    isWebPEnabled,
    ALLOWED_SOURCES
} = require('../utils/imageProxy');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run') || args.includes('-d');
const LIMIT = args.find(a => a.startsWith('--limit='))?.split('=')[1];
const FORCE = args.includes('--force') || args.includes('-f');

async function main() {
    console.log('🔄 Image WebP Conversion Script');
    console.log('================================\n');

    if (DRY_RUN) {
        console.log('📋 DRY RUN MODE - No images will be converted\n');
    }

    if (LIMIT) {
        console.log(`📋 LIMIT MODE - Only processing ${LIMIT} images\n`);
    }

    if (FORCE) {
        console.log('⚠️  FORCE MODE - Re-converting even if WebP exists\n');
    }

    // Check if WebP is enabled
    if (!isWebPEnabled()) {
        console.error('❌ Sharp is not installed. WebP conversion requires sharp.');
        console.error('   Install with: npm install sharp');
        process.exit(1);
    }

    console.log('✅ Sharp loaded - WebP conversion available\n');

    // Connect to MongoDB
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }

    // Fetch all anime
    console.log('📦 Fetching all anime...\n');
    const allAnime = await CustomAnime.find({}).lean();
    console.log(`Found ${allAnime.length} anime to process\n`);

    // Collect all unique image URLs
    const imageUrls = new Set();

    for (const anime of allAnime) {
        if (anime.poster && isAllowedSource(anime.poster)) {
            imageUrls.add(anime.poster);
        }
        if (anime.banner && isAllowedSource(anime.banner)) {
            imageUrls.add(anime.banner);
        }
    }

    const allUrls = [...imageUrls];
    const urlsToProcess = LIMIT ? allUrls.slice(0, parseInt(LIMIT)) : allUrls;

    console.log(`📷 Found ${allUrls.length} unique images from allowed sources`);
    console.log(`   Allowed sources: ${ALLOWED_SOURCES.join(', ')}`);
    console.log(`   Processing: ${urlsToProcess.length} images\n`);

    if (DRY_RUN) {
        console.log('📋 Images that would be converted:\n');
        for (const url of urlsToProcess.slice(0, 20)) {
            const webpKey = getImageKey(url, true);
            const legacyKey = getLegacyImageKey(url);
            console.log(`  Legacy: ${legacyKey}`);
            console.log(`  WebP:   ${webpKey}\n`);
        }
        if (urlsToProcess.length > 20) {
            console.log(`  ... and ${urlsToProcess.length - 20} more\n`);
        }
        console.log('\n✅ Dry run complete. Run without --dry-run to convert.');
        await mongoose.disconnect();
        return;
    }

    // Process images
    console.log('Processing in batches of 3...\n');

    const BATCH_SIZE = 3;
    let converted = 0;
    let alreadyWebP = 0;
    let failed = 0;
    let totalOriginalSize = 0;
    let totalWebPSize = 0;

    for (let i = 0; i < urlsToProcess.length; i += BATCH_SIZE) {
        const batch = urlsToProcess.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(urlsToProcess.length / BATCH_SIZE);

        console.log(`⏳ Processing batch ${batchNum}/${totalBatches} (${i + batch.length}/${urlsToProcess.length})...`);

        const batchPromises = batch.map(async (url) => {
            try {
                const webpKey = getImageKey(url, true);

                // Check if WebP version already exists
                if (!FORCE) {
                    const webpExists = await imageExistsInR2(webpKey);
                    if (webpExists) {
                        alreadyWebP++;
                        return { status: 'exists', url };
                    }
                }

                // Download and convert to WebP
                const buffer = await downloadAndCacheImage(url, webpKey, true);

                if (buffer) {
                    converted++;
                    return { status: 'converted', url, size: buffer.length };
                } else {
                    failed++;
                    return { status: 'failed', url };
                }
            } catch (err) {
                console.error(`   ❌ Error: ${err.message}`);
                failed++;
                return { status: 'failed', url, error: err.message };
            }
        });

        await Promise.all(batchPromises);
    }

    // Summary
    console.log('\n=====================================');
    console.log('📊 CONVERSION RESULTS:');
    console.log('=====================================');
    console.log(`  Total images:       ${urlsToProcess.length}`);
    console.log(`  Converted to WebP:  ${converted}`);
    console.log(`  Already WebP:       ${alreadyWebP}`);
    console.log(`  Failed:             ${failed}`);
    console.log('=====================================\n');

    if (converted > 0) {
        console.log('✅ WebP conversion complete!');
        console.log('   Images are now optimized and smaller.\n');
    }

    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
}

main().catch(err => {
    console.error('❌ Script error:', err);
    process.exit(1);
});
