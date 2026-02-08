const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const User = require('./models/User');
const { initializeWatchPartySocket } = require('./socket/watchParty');
const { initializeGlobalChatSocket } = require('./socket/globalChat');
const { CustomAnime } = require('./models/CustomAnime');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: function(origin, callback) {
            // Allow requests with no origin (like mobile apps, curl, etc)
            if (!origin) return callback(null, true);
            
            const allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:3000',
                'https://test.aavpanel.my.id',
                'https://aavpanel.my.id',
                'https://animeku.xyz',
                'https://www.animeku.xyz'
            ];
            
            if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
                callback(null, true);
            } else {
                console.log('[CORS] Blocked origin:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    maxHttpBufferSize: 1e6
});
const PORT = process.env.PORT || 5000;
const REFRESH_TOKEN_CLEANUP_MINUTES = parseInt(process.env.REFRESH_TOKEN_CLEANUP_MINUTES || '60', 10);

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://test.aavpanel.my.id',
        'https://aavpanel.my.id',
        'https://animeku.xyz',
        'https://www.animeku.xyz'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// ============================================
// SITE URL CONFIG
// ============================================
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://animeku.xyz';

// Helper function to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animestream';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/anime', require('./routes/anime'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/watch-progress', require('./routes/watchProgress'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/discussions', require('./routes/discussion'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/schedule-subscriptions', require('./routes/scheduleSubscription'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/badges', require('./routes/badge'));
app.use('/api/watchparty', require('./routes/watchParty'));
app.use('/api', require('./routes/turnstile'));

// SSR for Anime Detail Pages - Generate HTML with proper meta tags for SEO/Social Sharing
app.get('/anime/:slug', async (req, res) => {
    const acceptHeader = req.headers.accept || '';
    
    // Only handle browser/crawler requests (not API requests)
    if (!acceptHeader.includes('text/html')) {
        return res.status(404).json({ error: 'Not found' });
    }
    
    try {
        const { slug } = req.params;
        
        // Find anime by slug
        const anime = await CustomAnime.findBySlug(slug);
        
        if (!anime) {
            // If anime not found, redirect to frontend 404
            return res.redirect(302, `${FRONTEND_URL}/anime/${slug}`);
        }
        
        // Build absolute image URL
        let imageUrl = anime.banner || anime.poster;
        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('/') 
                ? `${FRONTEND_URL}${imageUrl}` 
                : `${FRONTEND_URL}/${imageUrl}`;
        }
        // Use logo as reliable fallback (1200x630 recommended for OG)
        const defaultImage = `${FRONTEND_URL}/images/logo.png`;
        const finalImage = imageUrl && imageUrl.startsWith('http') ? imageUrl : defaultImage;
        
        // Build anime URL
        const animeUrl = `${FRONTEND_URL}/anime/${anime.cleanSlug || anime.id}`;
        
        // Generate HTML with proper meta tags
        const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${anime.title} - Nonton Anime Subtitle Indonesia HD Gratis - Animeku</title>
    <meta name="description" content="Nonton ${anime.title} subtitle Indonesia streaming gratis di Animeku. ${anime.synopsis ? anime.synopsis.substring(0, 150) + '...' : 'Streaming anime sub Indo HD tanpa iklan.'}">
    <link rel="canonical" href="${animeUrl}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="video.tv_show">
    <meta property="og:url" content="${animeUrl}">
    <meta property="og:title" content="${anime.title} - Nonton Anime Subtitle Indonesia HD Gratis">
    <meta property="og:description" content="Nonton ${anime.title} subtitle Indonesia streaming gratis di Animeku. ${anime.synopsis ? anime.synopsis.substring(0, 150) + '...' : 'Streaming anime sub Indo HD tanpa iklan.'}">
    <meta property="og:image" content="${finalImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${anime.title} - Nonton Anime Subtitle Indonesia">
    <meta property="og:site_name" content="Animeku">
    <meta property="og:locale" content="id_ID">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${animeUrl}">
    <meta name="twitter:title" content="${anime.title} - Nonton Anime Subtitle Indonesia HD Gratis">
    <meta name="twitter:description" content="Nonton ${anime.title} subtitle Indonesia streaming gratis di Animeku.">
    <meta name="twitter:image" content="${finalImage}">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#0F0F1A">
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="${FRONTEND_URL}/favicon.svg">
    
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "TVSeries",
        "name": "${anime.title}",
        "description": "${anime.synopsis || ''}",
        "image": "${finalImage}",
        "url": "${animeUrl}",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "${anime.rating || '0'}",
            "bestRating": "10"
        },
        "genre": ${JSON.stringify(anime.genres || [])},
        "numberOfEpisodes": ${anime.episodes || 0},
        "countryOfOrigin": {
            "@type": "Country",
            "name": "Japan"
        },
        "inLanguage": "ja",
        "subtitleLanguage": "id"
    }
    </script>
    
    <!-- Redirect to actual SPA -->
    <meta http-equiv="refresh" content="0;url=${animeUrl}">
    <script>
        window.location.href = "${animeUrl}";
    </script>
    
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0F0F1A; color: white; text-align: center; padding: 50px 20px; }
        a { color: #6C5DD3; text-decoration: none; }
        .spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #6C5DD3; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="spinner"></div>
    <p>Loading ${anime.title}...</p>
    <p>If not redirected, <a href="${animeUrl}">click here</a>.</p>
    
    <!-- Hidden content for crawlers -->
    <div style="display:none;">
        <h1>${anime.title}</h1>
        <p>${anime.synopsis || ''}</p>
        <img src="${finalImage}" alt="${anime.title}">
    </div>
</body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
        
    } catch (err) {
        console.error('[SSR] Error rendering anime page:', err);
        // Redirect to frontend on error
        res.redirect(302, `${FRONTEND_URL}/anime/${req.params.slug}`);
    }
});

app.get('/', (req, res) => {
    // Check if request is from browser (wants HTML)
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
        return res.redirect(301, FRONTEND_URL);
    }
    res.send('AnimeStream API is running...');
});

// SSR for Watch Pages - Generate HTML with proper meta tags for SEO/Social Sharing
app.get('/watch/:slug/:episode', async (req, res) => {
    const acceptHeader = req.headers.accept || '';
    
    // Only handle browser/crawler requests (not API requests)
    if (!acceptHeader.includes('text/html')) {
        return res.status(404).json({ error: 'Not found' });
    }
    
    try {
        const { slug, episode } = req.params;
        const episodeNum = parseInt(episode, 10) || 1;
        
        // Find anime by slug
        const anime = await CustomAnime.findBySlug(slug);
        
        if (!anime) {
            // If anime not found, redirect to frontend 404
            return res.redirect(302, `${FRONTEND_URL}/watch/${slug}/${episodeNum}`);
        }
        
        // Build absolute image URL
        let imageUrl = anime.banner || anime.poster;
        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('/') 
                ? `${FRONTEND_URL}${imageUrl}` 
                : `${FRONTEND_URL}/${imageUrl}`;
        }
        // Use logo as reliable fallback
        const defaultImage = `${FRONTEND_URL}/images/logo.png`;
        const finalImage = imageUrl && imageUrl.startsWith('http') ? imageUrl : defaultImage;
        
        // Build watch URL
        const watchUrl = `${FRONTEND_URL}/watch/${anime.cleanSlug || anime.id}/${episodeNum}`;
        
        // Generate HTML with proper meta tags
        const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${anime.title} Episode ${episodeNum} - Nonton Anime Subtitle Indonesia HD - Animeku</title>
    <meta name="description" content="Streaming ${anime.title} Episode ${episodeNum} subtitle Indonesia kualitas HD gratis di Animeku. Nonton anime sub Indo tanpa iklan.">
    <link rel="canonical" href="${watchUrl}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="video.episode">
    <meta property="og:url" content="${watchUrl}">
    <meta property="og:title" content="${anime.title} Episode ${episodeNum} - Nonton Anime Subtitle Indonesia HD">
    <meta property="og:description" content="Streaming ${anime.title} Episode ${episodeNum} subtitle Indonesia kualitas HD gratis di Animeku.">
    <meta property="og:image" content="${finalImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${anime.title} Episode ${episodeNum} - Nonton Anime Subtitle Indonesia">
    <meta property="og:site_name" content="Animeku">
    <meta property="og:locale" content="id_ID">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${watchUrl}">
    <meta name="twitter:title" content="${anime.title} Episode ${episodeNum} - Nonton Anime Subtitle Indonesia HD">
    <meta name="twitter:description" content="Streaming ${anime.title} Episode ${episodeNum} subtitle Indonesia kualitas HD gratis di Animeku.">
    <meta name="twitter:image" content="${finalImage}">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#0F0F1A">
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="${FRONTEND_URL}/favicon.svg">
    
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": "${anime.title} Episode ${episodeNum}",
        "description": "Streaming ${anime.title} Episode ${episodeNum} subtitle Indonesia",
        "thumbnailUrl": "${finalImage}",
        "uploadDate": "${new Date().toISOString()}",
        "duration": "PT24M",
        "author": {
            "@type": "Organization",
            "name": "Animeku"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Animeku",
            "logo": {
                "@type": "ImageObject",
                "url": "${FRONTEND_URL}/favicon.svg"
            }
        }
    }
    </script>
    
    <!-- Redirect to actual SPA -->
    <meta http-equiv="refresh" content="0;url=${watchUrl}">
    <script>
        window.location.href = "${watchUrl}";
    </script>
    
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0F0F1A; color: white; text-align: center; padding: 50px 20px; }
        a { color: #6C5DD3; text-decoration: none; }
        .spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #6C5DD3; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="spinner"></div>
    <p>Loading ${anime.title} Episode ${episodeNum}...</p>
    <p>If not redirected, <a href="${watchUrl}">click here</a>.</p>
    
    <!-- Hidden content for crawlers -->
    <div style="display:none;">
        <h1>${anime.title} Episode ${episodeNum}</h1>
        <p>Streaming ${anime.title} Episode ${episodeNum} subtitle Indonesia kualitas HD gratis di Animeku.</p>
        <img src="${finalImage}" alt="${anime.title}">
    </div>
</body>
</html>`;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
        
    } catch (err) {
        console.error('[SSR] Error rendering watch page:', err);
        // Redirect to frontend on error
        res.redirect(302, `${FRONTEND_URL}/watch/${req.params.slug}/${req.params.episode}`);
    }
});

// Redirect any unknown paths to frontend (for direct browser access)
app.use((req, res, next) => {
    const acceptHeader = req.headers.accept || '';
    // If browser trying to access unknown route, redirect to frontend
    if (acceptHeader.includes('text/html')) {
        console.log(`[Redirect] Unknown path ${req.path} accessed from browser, redirecting to frontend`);
        return res.redirect(301, FRONTEND_URL);
    }
    // For API requests, continue to 404 handler
    next();
});

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error('[Server Error]', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Prevent unhandled exceptions from crashing the server
process.on('uncaughtException', (err) => {
    console.error('[Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection] at:', promise, 'reason:', reason);
});

// Initialize Socket.io handlers
initializeWatchPartySocket(io);
initializeGlobalChatSocket(io);

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Periodic cleanup for expired refresh tokens
const cleanupRefreshTokens = async () => {
    if (mongoose.connection.readyState !== 1) return;
    const now = new Date();
    try {
        const result = await User.updateMany(
            {
                $or: [
                    { 'refreshTokens.expiresAt': { $lte: now } },
                    { refreshTokenExpiresAt: { $lte: now } }
                ]
            },
            {
                $pull: { refreshTokens: { expiresAt: { $lte: now } } },
                $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 }
            }
        );
        if (result.modifiedCount) {
            console.log(`[Auth] Cleanup: removed expired refresh tokens for ${result.modifiedCount} user(s)`);
        }
    } catch (err) {
        console.error('[Auth] Cleanup error:', err.message);
    }
};

if (REFRESH_TOKEN_CLEANUP_MINUTES > 0) {
    setInterval(cleanupRefreshTokens, REFRESH_TOKEN_CLEANUP_MINUTES * 60 * 1000);
}
