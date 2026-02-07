#!/usr/bin/env node
/**
 * Image Optimization Script
 * Converts images to WebP and AVIF formats for better performance
 */

import sharp from 'sharp';
import { glob } from 'glob';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  // Input directories (relative to project root)
  inputDirs: [
    'public/images/**/*.{jpg,jpeg,png}',
    'src/assets/**/*.{jpg,jpeg,png}',
  ],
  // Output quality
  quality: {
    webp: 80,
    avif: 70,
  },
  // Responsive sizes
  sizes: [150, 300, 450, 600, 800, 1200],
};

// Convert single image
async function convertImage(inputPath) {
  const ext = extname(inputPath).toLowerCase();
  const baseName = basename(inputPath, ext);
  const dir = dirname(inputPath);
  
  // Skip if already WebP/AVIF
  if (['.webp', '.avif', '.gif'].includes(ext)) {
    console.log(`⏭️  Skipping ${inputPath} (already optimized)`);
    return;
  }

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`\n🖼️  Processing: ${inputPath}`);
    console.log(`   Original: ${metadata.width}x${metadata.height} (${Math.round(metadata.size / 1024)}KB)`);

    // Generate WebP
    const webpPath = join(dir, `${baseName}.webp`);
    await image
      .webp({ 
        quality: CONFIG.quality.webp,
        effort: 6, // Compression effort (0-6)
      })
      .toFile(webpPath);
    
    console.log(`   ✓ WebP: ${webpPath}`);

    // Generate AVIF (better compression, longer encode)
    const avifPath = join(dir, `${baseName}.avif`);
    await image
      .avif({ 
        quality: CONFIG.quality.avif,
        effort: 4, // Compression effort (0-9)
      })
      .toFile(avifPath);
    
    console.log(`   ✓ AVIF: ${avifPath}`);

    // Generate responsive sizes for large images
    if (metadata.width > 400) {
      for (const width of CONFIG.sizes) {
        if (width >= metadata.width) continue;
        
        const resizedWebp = join(dir, `${baseName}-${width}.webp`);
        await image
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: CONFIG.quality.webp })
          .toFile(resizedWebp);
        
        console.log(`   ✓ WebP ${width}w: ${resizedWebp}`);
      }
    }

  } catch (error) {
    console.error(`   ✗ Error processing ${inputPath}:`, error.message);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting image optimization...\n');
  
  const startTime = Date.now();
  let processedCount = 0;
  let skippedCount = 0;

  try {
    // Find all images
    const allImages = [];
    for (const pattern of CONFIG.inputDirs) {
      const matches = await glob(pattern, { 
        cwd: join(__dirname, '..'),
        absolute: true 
      });
      allImages.push(...matches);
    }

    console.log(`Found ${allImages.length} images to process\n`);

    // Process each image
    for (const imagePath of allImages) {
      const ext = extname(imagePath).toLowerCase();
      if (['.webp', '.avif', '.gif'].includes(ext)) {
        skippedCount++;
        continue;
      }
      
      await convertImage(imagePath);
      processedCount++;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Image optimization complete!');
    console.log(`   Processed: ${processedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Duration: ${duration}s`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
