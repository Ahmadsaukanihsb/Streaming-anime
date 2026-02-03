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

