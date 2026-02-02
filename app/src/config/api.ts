// Backend API URL
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

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

