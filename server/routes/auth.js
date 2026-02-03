const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const crypto = require('crypto');
const { signAccessToken } = require('../middleware/auth');
const { validateBody, EMAIL_REGEX } = require('../middleware/validate');

const SALT_ROUNDS = 10;
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10);
const MAX_REFRESH_TOKENS = parseInt(process.env.REFRESH_TOKEN_MAX || '5', 10);

function createRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
}

function hashRefreshToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function getRequestHost(req) {
    const forwardedHost = req.headers['x-forwarded-host'];
    const rawHost = (forwardedHost || req.headers.host || '').toString().split(',')[0].trim();
    return rawHost.split(':')[0];
}

function getRequestProto(req) {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const rawProto = (forwardedProto || '').toString().split(',')[0].trim().toLowerCase();
    if (rawProto) return rawProto;
    return req.secure ? 'https' : 'http';
}

function normalizeSameSite(value) {
    const normalized = String(value || 'lax').toLowerCase();
    if (normalized === 'lax' || normalized === 'strict' || normalized === 'none') {
        return normalized;
    }
    return 'lax';
}

function resolveCookieDomain(req, configuredDomain) {
    if (!configuredDomain) return undefined;
    const host = getRequestHost(req);
    if (!host) return undefined;
    const normalized = configuredDomain.startsWith('.') ? configuredDomain.slice(1) : configuredDomain;
    if (host === normalized || host.endsWith(`.${normalized}`)) {
        return configuredDomain;
    }
    return undefined;
}

function getRefreshCookieOptions(req) {
    const maxAge = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;
    const configuredSameSite = normalizeSameSite(process.env.COOKIE_SAMESITE || 'lax');
    const configuredDomain = process.env.COOKIE_DOMAIN;
    const secureRequested = process.env.COOKIE_SECURE === 'true';
    const proto = getRequestProto(req);
    const isHttps = proto === 'https';
    const warnings = [];

    let sameSite = configuredSameSite;
    const secure = secureRequested && isHttps;
    if (sameSite === 'none' && !secure) {
        sameSite = 'lax';
        warnings.push('sameSite downgraded to lax because request is not https');
    }

    const domain = resolveCookieDomain(req, configuredDomain);
    if (configuredDomain && !domain) {
        warnings.push(`domain ${configuredDomain} does not match host`);
    }

    const baseOptions = {
        httpOnly: true,
        secure,
        sameSite,
        path: '/api/auth'
    };

    if (domain) {
        baseOptions.domain = domain;
    }

    return { baseOptions, maxAge, warnings, host: getRequestHost(req), proto };
}

function setRefreshCookie(req, res, token) {
    const { baseOptions, maxAge, warnings, host, proto } = getRefreshCookieOptions(req);
    const hostOnlyOptions = { ...baseOptions };
    delete hostOnlyOptions.domain;

    // Clear any existing refresh_token cookies (host-only and domain)
    res.clearCookie('refresh_token', hostOnlyOptions);
    if (baseOptions.domain) {
        res.clearCookie('refresh_token', baseOptions);
    }

    if (warnings.length) {
        console.warn('[Auth] Cookie warning:', warnings.join('; '), `(host=${host || 'unknown'}, proto=${proto})`);
    }

    res.cookie('refresh_token', token, { ...baseOptions, maxAge });
}

function normalizeRefreshTokens(user) {
    if (!Array.isArray(user.refreshTokens)) {
        user.refreshTokens = [];
    }
}

function pruneRefreshTokens(user) {
    const now = new Date();
    normalizeRefreshTokens(user);
    user.refreshTokens = user.refreshTokens.filter(t => t.expiresAt && t.expiresAt > now);
    if (MAX_REFRESH_TOKENS > 0 && user.refreshTokens.length > MAX_REFRESH_TOKENS) {
        user.refreshTokens.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_TOKENS);
    }
}

async function saveRefreshToken(user, refreshToken, meta = {}) {
    const now = new Date();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

    normalizeRefreshTokens(user);
    user.refreshTokens = user.refreshTokens.filter(t => t.hash !== tokenHash);
    user.refreshTokens.push({
        hash: tokenHash,
        expiresAt,
        createdAt: now,
        userAgent: meta.userAgent,
        ip: meta.ip
    });

    // Clear legacy single-token fields once multi-token storage is used
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;

    pruneRefreshTokens(user);
    await user.save();
}

// Register
router.post('/register', validateBody([
    { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 80 },
    { field: 'email', required: true, type: 'string', minLength: 5, maxLength: 254, pattern: EMAIL_REGEX },
    { field: 'password', required: true, type: 'string', minLength: 6, maxLength: 200 }
]), async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = (email || '').toLowerCase().trim();

        let user = await User.findOne({ email: normalizedEmail });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        user = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            isAdmin: false, // Admin harus di-set manual di database
        });

        await user.save();

        // Return user tanpa password
        const userResponse = user.toObject();
        delete userResponse.password;

        // Log activity
        const Activity = require('../models/Activity');
        await Activity.create({
            type: 'user_registered',
            description: 'User baru terdaftar',
            itemId: user._id.toString(),
            itemTitle: user.name,
            userName: 'System'
        });

        const accessToken = signAccessToken(user);
        const refreshToken = createRefreshToken();
        const meta = { userAgent: req.headers['user-agent'], ip: req.ip };
        await saveRefreshToken(user, refreshToken, meta);
        console.log('[Auth] Register: refresh saved for user', user._id.toString(), 'hash', hashRefreshToken(refreshToken).slice(0, 12));
        setRefreshCookie(req, res, refreshToken);

        res.json({ ...userResponse, token: accessToken });
    } catch (err) {
        console.error('[Auth] Register error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Login
router.post('/login', validateBody([
    { field: 'email', required: true, type: 'string', minLength: 5, maxLength: 254, pattern: EMAIL_REGEX },
    { field: 'password', required: true, type: 'string', minLength: 6, maxLength: 200 }
]), async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = (email || '').toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        // Compare password dengan hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Return user tanpa password
        const userResponse = user.toObject();
        delete userResponse.password;
        const accessToken = signAccessToken(user);
        const refreshToken = createRefreshToken();
        const meta = { userAgent: req.headers['user-agent'], ip: req.ip };
        await saveRefreshToken(user, refreshToken, meta);
        console.log('[Auth] Login: refresh saved for user', user._id.toString(), 'hash', hashRefreshToken(refreshToken).slice(0, 12));
        setRefreshCookie(req, res, refreshToken);

        res.json({ ...userResponse, token: accessToken });
    } catch (err) {
        console.error('[Auth] Login error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token;
        if (!refreshToken) {
            console.warn('[Auth] Refresh: missing refresh_token cookie');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const refreshHash = hashRefreshToken(refreshToken);
        console.log('[Auth] Refresh: cookie present, length:', refreshToken.length, 'hash', refreshHash.slice(0, 12));

        const now = new Date();
        let user = await User.findOne({
            refreshTokens: { $elemMatch: { hash: refreshHash, expiresAt: { $gt: now } } }
        });
        let matchedLegacy = false;

        if (!user) {
            user = await User.findOne({
                refreshTokenHash: refreshHash,
                refreshTokenExpiresAt: { $gt: now }
            });
            if (user) matchedLegacy = true;
        }

        if (!user) {
            const byArray = await User.findOne({ 'refreshTokens.hash': refreshHash }).select('_id refreshTokens');
            if (byArray) {
                const token = (byArray.refreshTokens || []).find(t => t.hash === refreshHash);
                console.warn('[Auth] Refresh: token expired for user', byArray._id.toString(), 'expiresAt', token?.expiresAt);
            } else {
                const byHash = await User.findOne({ refreshTokenHash: refreshHash }).select('_id refreshTokenExpiresAt');
                if (byHash) {
                    console.warn('[Auth] Refresh: token expired for user', byHash._id.toString(), 'expiresAt', byHash.refreshTokenExpiresAt);
                } else {
                    console.warn('[Auth] Refresh: token hash not found');
                }
            }
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Rotate refresh token
        const newRefresh = createRefreshToken();
        if (matchedLegacy) {
            user.refreshTokenHash = undefined;
            user.refreshTokenExpiresAt = undefined;
        } else if (Array.isArray(user.refreshTokens)) {
            user.refreshTokens = user.refreshTokens.filter(t => t.hash !== refreshHash);
        }
        const meta = { userAgent: req.headers['user-agent'], ip: req.ip };
        await saveRefreshToken(user, newRefresh, meta);
        setRefreshCookie(req, res, newRefresh);

        const accessToken = signAccessToken(user);
        res.json({ token: accessToken });
    } catch (err) {
        console.error('[Auth] Refresh error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Logout (revoke refresh token)
router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refresh_token;
        if (refreshToken) {
            const refreshHash = hashRefreshToken(refreshToken);
            const user = await User.findOne({
                $or: [
                    { 'refreshTokens.hash': refreshHash },
                    { refreshTokenHash: refreshHash }
                ]
            });
            if (user) {
                if (Array.isArray(user.refreshTokens)) {
                    user.refreshTokens = user.refreshTokens.filter(t => t.hash !== refreshHash);
                }
                if (user.refreshTokenHash === refreshHash) {
                    user.refreshTokenHash = undefined;
                    user.refreshTokenExpiresAt = undefined;
                }
                await user.save();
            }
        }

        const { baseOptions } = getRefreshCookieOptions(req);
        const hostOnlyOptions = { ...baseOptions };
        delete hostOnlyOptions.domain;

        res.clearCookie('refresh_token', hostOnlyOptions);
        if (baseOptions.domain) {
            res.clearCookie('refresh_token', baseOptions);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('[Auth] Logout error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

module.exports = router;

