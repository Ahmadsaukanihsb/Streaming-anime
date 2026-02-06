/**
 * Cloudflare R2 Storage Utility
 * Uses AWS S3 SDK (R2 is S3-compatible)
 * 
 * Dua bucket:
 * - R2_BUCKET_NAME: Bucket untuk video (streaminganime)
 * - R2_BUCKET_FRONTEND: Bucket untuk frontend (front-end) - optional
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');

// Initialize S3 Client for R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

// Bucket untuk video (streaming)
const VIDEO_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'streaminganime';

// Bucket untuk frontend (optional, jika terpisah)
const FRONTEND_BUCKET_NAME = process.env.R2_BUCKET_FRONTEND || process.env.R2_BUCKET_NAME;

// Public URLs
const VIDEO_PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.R2_VIDEO_PUBLIC_URL;
const FRONTEND_PUBLIC_URL = process.env.R2_FRONTEND_PUBLIC_URL || process.env.R2_PUBLIC_URL;

/**
 * Upload file to R2 from buffer
 * @param {Buffer} fileBuffer - File data
 * @param {string} key - File path/name in bucket (e.g., "anime/one-piece/ep-1.mp4")
 * @param {string} contentType - MIME type (e.g., "video/mp4")
 * @param {string} bucketType - 'video' atau 'frontend' (default: 'video')
 * @returns {Promise<{success: boolean, url: string, key: string}>}
 */
async function uploadFile(fileBuffer, key, contentType = 'video/mp4', bucketType = 'video') {
    try {
        const bucket = bucketType === 'frontend' ? FRONTEND_BUCKET_NAME : VIDEO_BUCKET_NAME;
        const publicUrlBase = bucketType === 'frontend' ? FRONTEND_PUBLIC_URL : VIDEO_PUBLIC_URL;
        
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType
        });

        await s3Client.send(command);

        const publicUrl = `${publicUrlBase}/${key}`;

        console.log(`[R2] Uploaded to ${bucket}: ${key}`);

        return {
            success: true,
            url: publicUrl,
            key: key
        };
    } catch (error) {
        console.error('[R2] Upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Upload file to R2 from file path (streaming - for large files)
 * @param {string} filePath - Path to the file
 * @param {string} key - File path/name in bucket
 * @param {string} contentType - MIME type
 * @param {string} bucketType - 'video' atau 'frontend' (default: 'video')
 * @returns {Promise<{success: boolean, url: string, key: string}>}
 */
async function uploadFromPath(filePath, key, contentType = 'video/mp4', bucketType = 'video') {
    try {
        const bucket = bucketType === 'frontend' ? FRONTEND_BUCKET_NAME : VIDEO_BUCKET_NAME;
        const publicUrlBase = bucketType === 'frontend' ? FRONTEND_PUBLIC_URL : VIDEO_PUBLIC_URL;
        
        const fileStream = fs.createReadStream(filePath);
        const stats = fs.statSync(filePath);

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileStream,
            ContentType: contentType,
            ContentLength: stats.size
        });

        await s3Client.send(command);

        const publicUrl = `${publicUrlBase}/${key}`;

        console.log(`[R2] Uploaded from path to ${bucket}: ${key} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);

        return {
            success: true,
            url: publicUrl,
            key: key
        };
    } catch (error) {
        console.error('[R2] Upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Delete file from R2
 * @param {string} key - File path/name in bucket
 * @param {string} bucketType - 'video' atau 'frontend' (default: 'video')
 * @returns {Promise<{success: boolean}>}
 */
async function deleteFile(key, bucketType = 'video') {
    try {
        const bucket = bucketType === 'frontend' ? FRONTEND_BUCKET_NAME : VIDEO_BUCKET_NAME;
        
        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        });

        await s3Client.send(command);

        console.log(`[R2] Deleted from ${bucket}: ${key}`);

        return { success: true };
    } catch (error) {
        console.error('[R2] Delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * List files in a folder
 * @param {string} prefix - Folder path (e.g., "anime/one-piece/")
 * @param {string} bucketType - 'video' atau 'frontend' (default: 'video')
 * @returns {Promise<Array>}
 */
async function listFiles(prefix = '', bucketType = 'video') {
    try {
        const bucket = bucketType === 'frontend' ? FRONTEND_BUCKET_NAME : VIDEO_BUCKET_NAME;
        const publicUrlBase = bucketType === 'frontend' ? FRONTEND_PUBLIC_URL : VIDEO_PUBLIC_URL;
        
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix
        });

        const response = await s3Client.send(command);

        return (response.Contents || []).map(item => ({
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified,
            url: `${publicUrlBase}/${item.Key}`
        }));
    } catch (error) {
        console.error('[R2] List error:', error);
        return [];
    }
}

/**
 * Generate public URL for a file
 * @param {string} key - File path/name
 * @param {string} bucketType - 'video' atau 'frontend' (default: 'video')
 * @returns {string}
 */
function getPublicUrl(key, bucketType = 'video') {
    const publicUrlBase = bucketType === 'frontend' ? FRONTEND_PUBLIC_URL : VIDEO_PUBLIC_URL;
    return `${publicUrlBase}/${key}`;
}

/**
 * Generate a safe filename from anime title and episode
 * @param {string} animeTitle 
 * @param {number} episode 
 * @param {string} quality 
 * @returns {string}
 */
function generateVideoKey(animeTitle, episode, quality = '720p') {
    const slug = animeTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    return `anime/${slug}/ep-${episode}-${quality}.mp4`;
}

/**
 * Generate presigned URL for direct browser upload to R2
 * @param {string} key - File path/name in bucket
 * @param {string} contentType - MIME type
 * @param {number} expiresIn - URL expiry in seconds (default 1 hour)
 * @param {string} bucketType - 'video' atau 'frontend' (default: 'video')
 * @returns {Promise<{success: boolean, uploadUrl: string, publicUrl: string, key: string}>}
 */
async function getPresignedUploadUrl(key, contentType = 'video/mp4', expiresIn = 3600, bucketType = 'video') {
    try {
        const bucket = bucketType === 'frontend' ? FRONTEND_BUCKET_NAME : VIDEO_BUCKET_NAME;
        const publicUrlBase = bucketType === 'frontend' ? FRONTEND_PUBLIC_URL : VIDEO_PUBLIC_URL;
        
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: contentType
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
        const publicUrl = `${publicUrlBase}/${key}`;

        console.log(`[R2] Generated presigned URL for ${bucket}: ${key}`);

        return {
            success: true,
            uploadUrl,
            publicUrl,
            key
        };
    } catch (error) {
        console.error('[R2] Presign error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate signed URL for video streaming (viewing, not uploading)
 * @param {string} key - File path/name in bucket (e.g., "anime/one-piece/ep-1.mp4")
 * @param {number} expiresIn - URL expiry in seconds (default 10 minutes)
 * @param {string} bucketType - 'video' atau 'frontend' (default: 'video')
 * @returns {Promise<{success: boolean, signedUrl: string, expiresIn: number}>}
 */
async function getSignedVideoUrl(key, expiresIn = 600, bucketType = 'video') {
    try {
        const bucket = bucketType === 'frontend' ? FRONTEND_BUCKET_NAME : VIDEO_BUCKET_NAME;
        
        // Import GetObjectCommand here to avoid issues
        const { GetObjectCommand } = require('@aws-sdk/client-s3');
        
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

        console.log(`[R2] Generated signed URL for viewing ${bucket}: ${key} (expires in ${expiresIn}s)`);

        return {
            success: true,
            signedUrl,
            expiresIn
        };
    } catch (error) {
        console.error('[R2] Signed URL error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    uploadFile,
    uploadFromPath,
    deleteFile,
    listFiles,
    getPublicUrl,
    generateVideoKey,
    getPresignedUploadUrl,
    getSignedVideoUrl,
    s3Client,
    VIDEO_BUCKET_NAME,
    FRONTEND_BUCKET_NAME
};
