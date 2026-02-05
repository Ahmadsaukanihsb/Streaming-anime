// Backend API URL
const resolveBackendUrl = () => {
    const envUrl = import.meta.env.VITE_BACKEND_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
        return envUrl;
    }

    if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        if (hostname.startsWith('test.')) {
            return `${protocol}//backend.${hostname.slice(5)}`;
        }
        if (hostname === 'animeku.xyz' || hostname === 'www.animeku.xyz') {
            return `${protocol}//api.animeku.xyz`;
        }
        if (hostname.endsWith('.animeku.xyz') && !hostname.startsWith('api.')) {
            return `${protocol}//api.animeku.xyz`;
        }
        return `${protocol}//${hostname}`;
    }

    return 'http://localhost:5000';
};

export const BACKEND_URL = resolveBackendUrl();

export const API_CONFIG = {
    // DramaBos API - Working video streams!
    BASE_URL: 'https://dramabos.asia/api/tensei',

    // Old Sansekai API (stream always empty)
    // BASE_URL: 'https://api.sansekai.my.id/api',

    // Endpoints
    endpoints: {
        home: '/home',           // Latest/home releases
        ongoing: '/ongoing',     // Ongoing anime
        search: '/search',       // Search: ?q=query
        detail: '/detail',       // Detail: /detail/{slug}
        watch: '/watch',         // Watch: /watch/{slug} (Embeds)
        stream: '/stream',       // Stream: /stream/{episodeSlug}
    }
};

export const getApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`;

// Site Configuration
export const DEFAULT_SITE_NAME = 'Animeku';
export const DEFAULT_SITE_DESCRIPTION = 'Platform streaming anime terbaik untuk penggemar anime Indonesia';

// Helper to get site name from settings (will be used with React state)
export const getStoredSiteName = (): string => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('siteName') || DEFAULT_SITE_NAME;
    }
    return DEFAULT_SITE_NAME;
};

export const setStoredSiteName = (name: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('siteName', name);
    }
};

