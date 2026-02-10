/**
 * Security utilities for sanitization and validation (Frontend)
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param html - String that might contain HTML
 * @returns Sanitized string safe for display
 */
export function escapeHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';
    return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Sanitize content for display with preserved line breaks
 * Converts newlines to <br> tags after escaping HTML
 * @param content - Raw content string
 * @returns Sanitized HTML string
 */
export function sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') return '';
    // First escape HTML
    let sanitized = escapeHtml(content);
    // Then convert line breaks to <br> tags
    sanitized = sanitized.replace(/\n/g, '<br>');
    return sanitized;
}

/**
 * Sanitize URL to prevent javascript: protocol injection
 * @param url - URL string to sanitize
 * @returns Safe URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim().toLowerCase();
    // Block dangerous protocols
    if (trimmed.startsWith('javascript:') || 
        trimmed.startsWith('data:') || 
        trimmed.startsWith('vbscript:') ||
        trimmed.startsWith('file:')) {
        return '';
    }
    return url;
}

/**
 * Strip all HTML tags from content (for plain text display)
 * @param html - String that might contain HTML
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
