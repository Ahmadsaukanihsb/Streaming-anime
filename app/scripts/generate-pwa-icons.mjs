// Generate PWA icons from source logo
// Run: node scripts/generate-pwa-icons.mjs

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_LOGO = path.join(__dirname, '../public/images/logo.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
    console.log('🎨 Generating PWA icons...');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Check if source exists
    if (!fs.existsSync(SOURCE_LOGO)) {
        console.error('❌ Source logo not found:', SOURCE_LOGO);
        console.log('Using favicon.svg as fallback...');

        // Use SVG favicon as source
        const svgSource = path.join(__dirname, '../public/favicon.svg');
        if (!fs.existsSync(svgSource)) {
            console.error('❌ No source image found');
            process.exit(1);
        }

        for (const size of ICON_SIZES) {
            const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
            await sharp(svgSource)
                .resize(size, size, { fit: 'contain', background: { r: 15, g: 15, b: 26, alpha: 1 } })
                .png()
                .toFile(outputPath);
            console.log(`✅ Generated: icon-${size}x${size}.png`);
        }
    } else {
        // Use PNG logo
        for (const size of ICON_SIZES) {
            const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
            await sharp(SOURCE_LOGO)
                .resize(size, size, { fit: 'contain', background: { r: 15, g: 15, b: 26, alpha: 1 } })
                .png()
                .toFile(outputPath);
            console.log(`✅ Generated: icon-${size}x${size}.png`);
        }
    }

    // Generate Apple Touch Icon
    const appleTouchIcon = path.join(__dirname, '../public/apple-touch-icon.png');
    await sharp(fs.existsSync(SOURCE_LOGO) ? SOURCE_LOGO : path.join(__dirname, '../public/favicon.svg'))
        .resize(180, 180, { fit: 'contain', background: { r: 15, g: 15, b: 26, alpha: 1 } })
        .png()
        .toFile(appleTouchIcon);
    console.log('✅ Generated: apple-touch-icon.png (180x180)');

    // Generate other Apple sizes
    const appleSizes = [152, 120];
    for (const size of appleSizes) {
        const outputPath = path.join(__dirname, `../public/apple-touch-icon-${size}x${size}.png`);
        await sharp(fs.existsSync(SOURCE_LOGO) ? SOURCE_LOGO : path.join(__dirname, '../public/favicon.svg'))
            .resize(size, size, { fit: 'contain', background: { r: 15, g: 15, b: 26, alpha: 1 } })
            .png()
            .toFile(outputPath);
        console.log(`✅ Generated: apple-touch-icon-${size}x${size}.png`);
    }

    console.log('\n🎉 PWA icons generated successfully!');
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

generateIcons().catch(console.error);
