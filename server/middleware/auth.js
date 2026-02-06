const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';

function signAccessToken(user) {
    return jwt.sign(
        { id: user._id.toString(), isAdmin: !!user.isAdmin },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
    );
}

function getTokenFromHeader(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
        return header.slice(7);
    }
    return null;
}

async function authenticate(req) {
    try {
        const token = getTokenFromHeader(req);
        if (!token) return null;

        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.id).select('-password');
        if (!user) return null;

        return {
            id: user._id.toString(),
            isAdmin: !!user.isAdmin,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            communityRole: user.communityRole
        };
    } catch (err) {
        return null;
    }
}

async function requireAuth(req, res, next) {
    const user = await authenticate(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    next();
}

async function requireAdmin(req, res, next) {
    if (!req.user) {
        const user = await authenticate(req);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.user = user;
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin only' });
    }
    next();
}

module.exports = {
    signAccessToken,
    authenticate,
    requireAuth,
    authenticateToken: requireAuth, // Alias for routes using authenticateToken
    requireAdmin
};
