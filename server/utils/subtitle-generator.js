/**
 * Subtitle Generator Service
 * Supports OpenAI Whisper API and local faster-whisper
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const FormData = require('form-data');

/**
 * Translate text using Google Translate (free, no API key needed)
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (id, en, ja, etc)
 * @param {string} sourceLang - Source language code (default: auto)
 * @returns {Promise<string>} - Translated text
 */
const translateText = async (text, targetLang = 'id', sourceLang = 'auto') => {
    // Skip empty or useless text
    if (!text || text.trim() === '' || text.trim() === '...' || text.trim() === '…') {
        return '';
    }

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url);
        const data = await response.json();

        // Extract translated text from response
        if (data && data[0]) {
            const translated = data[0].map(item => item[0]).filter(Boolean).join('');
            console.log(`[Translate] "${text.substring(0, 30)}..." => "${translated.substring(0, 30)}..."`);
            return translated;
        }
        return text;
    } catch (error) {
        console.error('[Translate] Error:', error.message);
        return text; // Return original if translation fails
    }
};

/**
 * Translate all segments to target language
 * @param {array} segments - Array of {start, end, text}
 * @param {string} targetLang - Target language (id, en, ja)
 * @returns {Promise<array>} - Translated segments
 */
const translateSegments = async (segments, targetLang) => {
    // Filter out empty or useless segments BEFORE translation
    const validSegments = segments.filter(seg => {
        const text = seg.text?.trim() || '';
        // Skip segments that are empty, just dots, or just music indicators
        if (!text || text === '...' || text === '…' || text.startsWith('[') || text.startsWith('♪')) {
            return false;
        }
        return true;
    });

    console.log(`[Subtitle] Translating ${validSegments.length} valid segments to ${targetLang}... (filtered ${segments.length - validSegments.length} empty/music segments)`);

    const translatedSegments = [];
    const batchSize = 10; // Translate in batches to avoid rate limits

    for (let i = 0; i < validSegments.length; i += batchSize) {
        const batch = validSegments.slice(i, i + batchSize);

        const translatedBatch = await Promise.all(
            batch.map(async (segment) => {
                const translatedText = await translateText(segment.text, targetLang);
                return { ...segment, text: translatedText };
            })
        );

        // Only add segments with actual text
        translatedSegments.push(...translatedBatch.filter(seg => seg.text && seg.text.trim()));

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < validSegments.length) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay
        }
    }

    console.log(`[Subtitle] Translation complete! Final: ${translatedSegments.length} segments`);
    return translatedSegments;
};

// Check if ffmpeg is available
const checkFFmpeg = () => {
    return new Promise((resolve) => {
        const proc = spawn('ffmpeg', ['-version']);
        proc.on('error', () => resolve(false));
        proc.on('close', (code) => resolve(code === 0));
    });
};

/**
 * Extract audio from video file using FFmpeg
 * @param {string} videoPath - Path to video file
 * @param {string} outputPath - Path for output audio
 * @returns {Promise<string>} - Path to extracted audio
 */
const extractAudio = async (videoPath, outputPath) => {
    return new Promise((resolve, reject) => {
        const args = [
            '-i', videoPath,
            '-vn',              // No video
            '-acodec', 'mp3',   // MP3 codec
            '-ar', '16000',     // 16kHz sample rate (optimal for Whisper)
            '-ac', '1',         // Mono
            '-y',               // Overwrite
            outputPath
        ];

        const proc = spawn('ffmpeg', args);

        proc.stderr.on('data', (data) => {
            // FFmpeg outputs to stderr
            console.log('[FFmpeg]', data.toString());
        });

        proc.on('error', (err) => {
            reject(new Error(`FFmpeg error: ${err.message}`));
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(outputPath);
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
    });
};

/**
 * Transcribe using OpenAI Whisper API
 * @param {string} audioPath - Path to audio file
 * @param {object} options - Language, translation options
 * @returns {Promise<object>} - Transcription result
 */
const transcribeWithOpenAI = async (audioPath, options = {}) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const { language, translate = false } = options;

    // Read file as buffer and create Blob
    const fileBuffer = fs.readFileSync(audioPath);
    const fileName = path.basename(audioPath);
    const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });

    // Use native FormData
    const formData = new globalThis.FormData();
    formData.append('file', blob, fileName);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    if (language && language !== 'auto') {
        formData.append('language', language);
    }

    const endpoint = translate
        ? 'https://api.openai.com/v1/audio/translations'
        : 'https://api.openai.com/v1/audio/transcriptions';

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await response.json();

    return {
        language: result.language,
        duration: result.duration,
        segments: result.segments.map(s => ({
            start: s.start,
            end: s.end,
            text: s.text.trim()
        }))
    };
};

/**
 * Transcribe using local faster-whisper (Python)
 * @param {string} audioPath - Path to audio file
 * @param {object} options - Language, model options
 * @returns {Promise<object>} - Transcription result
 */
const transcribeWithLocalWhisper = async (audioPath, options = {}) => {
    const {
        language = null,
        model = process.env.WHISPER_MODEL || 'base',
        translate = false
    } = options;

    const scriptPath = path.join(__dirname, '../scripts/whisper_local.py');

    if (!fs.existsSync(scriptPath)) {
        throw new Error('whisper_local.py script not found');
    }

    return new Promise((resolve, reject) => {
        const args = [
            scriptPath,
            audioPath,
            language || 'auto',
            model,
            translate ? 'true' : 'false'
        ];

        const proc = spawn('py', ['-3.11', ...args]);
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
            console.log('[Python stderr]', data.toString());
        });

        proc.on('error', (err) => {
            reject(new Error(`Python error: ${err.message}`));
        });

        proc.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(stdout);
                    if (result.error) {
                        reject(new Error(result.error));
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse output: ${stdout}`));
                }
            } else {
                // Python script outputs errors as JSON to stdout
                try {
                    const result = JSON.parse(stdout);
                    if (result.error) {
                        reject(new Error(result.error));
                        return;
                    }
                } catch (e) {
                    // Not JSON, use stderr
                }
                reject(new Error(`Python exited with code ${code}: ${stderr || stdout}`));
            }
        });
    });
};

/**
 * Convert transcription segments to WebVTT format
 * @param {array} segments - Array of {start, end, text}
 * @returns {string} - VTT content
 */
const convertToVTT = (segments) => {
    let vtt = 'WEBVTT\n\n';
    let validIndex = 0;

    // Filter function to detect useless segments
    const isValidSegment = (text) => {
        if (!text) return false;
        const cleaned = text.trim();
        // Skip if empty, only dots/ellipsis, or too short
        if (!cleaned) return false;
        if (/^[.\s…]+$/.test(cleaned)) return false; // Only dots/spaces/ellipsis
        if (cleaned.length < 2) return false; // Single character
        return true;
    };

    segments.forEach((segment) => {
        if (!isValidSegment(segment.text)) return; // Skip invalid

        validIndex++;
        const startTime = formatVTTTime(segment.start);
        const endTime = formatVTTTime(segment.end);

        vtt += `${validIndex}\n`;
        vtt += `${startTime} --> ${endTime}\n`;
        vtt += `${segment.text.trim()}\n\n`;
    });

    console.log(`[VTT] Generated ${validIndex} valid cues (filtered ${segments.length - validIndex} empty/dot segments)`);
    return vtt;
};

/**
 * Format seconds to VTT timestamp (HH:MM:SS.mmm)
 */
const formatVTTTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

/**
 * Main subtitle generation function
 * @param {string} videoUrl - URL or path to video
 * @param {object} options - Generation options
 * @returns {Promise<object>} - { vttContent, language, duration }
 */
const generateSubtitle = async (videoUrl, options = {}) => {
    const {
        provider = process.env.WHISPER_PROVIDER || 'openai',
        language,
        translate = false,
        model = 'base'
    } = options;

    // Check FFmpeg
    const hasFFmpeg = await checkFFmpeg();
    if (!hasFFmpeg) {
        throw new Error('FFmpeg is not installed or not in PATH');
    }

    // Create temp directory
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempId = `subtitle_${Date.now()}`;
    const audioPath = path.join(tempDir, `${tempId}.mp3`);

    try {
        // Extract audio directly from URL using FFmpeg (no need to download video first)
        console.log('[Subtitle] Extracting audio from video...');
        console.log('[Subtitle] Video URL:', videoUrl);
        await extractAudio(videoUrl, audioPath);

        // Transcribe based on provider
        console.log(`[Subtitle] Transcribing with ${provider}...`);
        let transcription;

        if (provider === 'openai') {
            transcription = await transcribeWithOpenAI(audioPath, { language, translate });
        } else {
            // For Local Whisper:
            // If target is Indonesian ('id'), we usually want to translate from Japanese/English audio.
            // Whisper doesn't support direct JP->ID translation.
            // So we tell Whisper: Source=Auto (or JA), Task=Translate (output English)
            // Then we auto-translate English -> Indonesian later.

            let whisperLanguage = language;
            let whisperTranslate = translate;

            if (language === 'id') {
                whisperLanguage = 'ja'; // Assume Anime is Japanese
                whisperTranslate = true; // Translate to English first
            }

            transcription = await transcribeWithLocalWhisper(audioPath, {
                language: whisperLanguage,
                translate: whisperTranslate,
                model
            });
        }

        // Auto-translate if Local Whisper and target language is Indonesian
        let segments = transcription.segments;
        let finalLanguage = transcription.language;

        if (provider === 'local' && language === 'id') {
            console.log('[Subtitle] Auto-translating to Indonesian...');
            segments = await translateSegments(segments, 'id');
            finalLanguage = 'id';
        }

        // Convert to VTT with styling
        const vttContent = convertToVTT(segments);

        return {
            vttContent,
            language: finalLanguage,
            duration: transcription.duration,
            segmentCount: segments.length,
            provider
        };

    } finally {
        // Cleanup temp files
        try {
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (e) {
            console.error('[Subtitle] Cleanup error:', e);
        }
    }
};

module.exports = {
    generateSubtitle,
    extractAudio,
    transcribeWithOpenAI,
    transcribeWithLocalWhisper,
    convertToVTT,
    checkFFmpeg,
    translateText
};
