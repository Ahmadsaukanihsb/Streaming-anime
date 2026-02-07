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

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://test.aavpanel.my.id',
            'https://aavpanel.my.id',
            'https://animeku.xyz',
            'https://www.animeku.xyz'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true, // Compatibility with older clients
    pingTimeout: 60000, // Increase for mobile connections
    pingInterval: 25000,
    connectTimeout: 45000
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
// BROWSER REDIRECT PROTECTION
// Redirect direct browser access to main website
// ============================================
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://animeku.xyz';

app.use((req, res, next) => {
    // Skip API endpoints that should be accessible (like health check)
    if (req.path === '/' || req.path.startsWith('/api/health')) {
        return next();
    }

    // Check if request wants HTML (browser access)
    const acceptHeader = req.headers.accept || '';
    const wantsHtml = acceptHeader.includes('text/html');

    // Check referer/origin
    const referer = req.headers.referer || '';
    const origin = req.headers.origin || '';
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://test.aavpanel.my.id',
        'https://aavpanel.my.id',
        'https://animeku.xyz',
        'https://www.animeku.xyz'
    ];

    const isFromFrontend = allowedOrigins.some(url => 
        referer.startsWith(url) || origin === url
    );

    // If browser access without proper referer, redirect to website
    if (wantsHtml && !isFromFrontend) {
        console.log(`[Redirect] Blocked direct browser access to ${req.path} from ${req.ip}`);
        return res.redirect(301, FRONTEND_URL);
    }

    next();
});

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

app.get('/', (req, res) => {
    // Check if request is from browser (wants HTML)
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
        return res.redirect(301, FRONTEND_URL);
    }
    res.send('AnimeStream API is running...');
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
