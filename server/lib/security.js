/**
 * Security utilities for sanitization and validation
 */

/**
 * Escape special regex characters to prevent regex injection
 * @param {string} string
 * @returns {string}
 */
function escapeRegex(string) {
    if (!string || typeof string !== 'string') return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize HTML content to prevent XSS
 * Escapes HTML special characters
 * @param {string} html
 * @returns {string}
 */
function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return '';
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Sanitize content for display (preserves line breaks)
 * @param {string} content
 * @returns {string}
 */
function sanitizeContent(content) {
    if (!content || typeof content !== 'string') return '';
    // First escape HTML
    let sanitized = sanitizeHtml(content);
    // Then convert line breaks to <br> tags for display
    sanitized = sanitized.replace(/\n/g, '<br>');
    return sanitized;
}

/**
 * Rate limiter using in-memory store
 * Simple implementation for development/testing
 */
class SimpleRateLimiter {
    constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.requests = new Map();
        // Cleanup old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    cleanup() {
        const now = Date.now();
        for (const [key, data] of this.requests.entries()) {
            if (now - data.resetTime > this.windowMs) {
                this.requests.delete(key);
            }
        }
    }

    isAllowed(identifier) {
        const now = Date.now();
        const data = this.requests.get(identifier);

        if (!data || now > data.resetTime) {
            // New window
            this.requests.set(identifier, {
                count: 1,
                resetTime: now + this.windowMs
            });
            return { allowed: true, remaining: this.maxRequests - 1 };
        }

        if (data.count >= this.maxRequests) {
            return { 
                allowed: false, 
                remaining: 0,
                resetTime: data.resetTime 
            };
        }

        data.count++;
        return { allowed: true, remaining: this.maxRequests - data.count };
    }
}

// Create rate limiters for different endpoints
const authRateLimiter = new SimpleRateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes for auth
const apiRateLimiter = new SimpleRateLimiter(60 * 1000, 60); // 60 requests per minute for API

/**
 * Middleware factory for rate limiting
 * @param {SimpleRateLimiter} limiter
 * @param {string} identifierKey - 'ip' or 'userId'
 */
function createRateLimitMiddleware(limiter, identifierKey = 'ip') {
    return (req, res, next) => {
        const identifier = identifierKey === 'ip' 
            ? req.ip || req.connection.remoteAddress || 'unknown'
            : req.user?.id || req.ip;

        const result = limiter.isAllowed(identifier);

        if (!result.allowed) {
            const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
            return res.status(429).json({
                error: 'Too many requests',
                message: `Please try again after ${retryAfter} seconds`,
                retryAfter
            });
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        next();
    };
}

module.exports = {
    escapeRegex,
    sanitizeHtml,
    sanitizeContent,
    SimpleRateLimiter,
    authRateLimiter,
    apiRateLimiter,
    createRateLimitMiddleware
};
