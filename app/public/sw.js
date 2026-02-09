// Animeku PWA Service Worker
// Version: 1.0.0

const CACHE_NAME = 'animeku-v1';
const STATIC_CACHE = 'animeku-static-v1';
const DYNAMIC_CACHE = 'animeku-dynamic-v1';
const IMAGE_CACHE = 'animeku-images-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
];

// Skip waiting and claim clients immediately
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[ServiceWorker] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => {
                        return name.startsWith('animeku-') &&
                            name !== STATIC_CACHE &&
                            name !== DYNAMIC_CACHE &&
                            name !== IMAGE_CACHE;
                    })
                    .map((name) => {
                        console.log('[ServiceWorker] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // Skip API requests (always fetch fresh)
    if (url.pathname.startsWith('/api/') || url.hostname.includes('api.animeku')) {
        return;
    }

    // Skip video streams
    if (request.destination === 'video' || url.pathname.includes('.m3u8') || url.pathname.includes('.ts')) {
        return;
    }

    // Image caching strategy: Cache First with Network Fallback
    if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        // Return cached image and update cache in background
                        fetch(request).then((response) => {
                            if (response && response.status === 200) {
                                cache.put(request, response.clone());
                            }
                        }).catch(() => { });
                        return cachedResponse;
                    }

                    // Not in cache, fetch and cache
                    return fetch(request).then((response) => {
                        if (response && response.status === 200) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    }).catch(() => {
                        // Return offline placeholder if available
                        return caches.match('/images/offline-placeholder.png');
                    });
                });
            })
        );
        return;
    }

    // HTML pages: Network First with Cache Fallback
    if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Return offline page for navigation requests
                        return caches.match('/');
                    });
                })
        );
        return;
    }

    // Static assets (JS, CSS, fonts): Stale While Revalidate
    if (request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'font' ||
        url.pathname.match(/\.(js|css|woff2?)$/i)) {
        event.respondWith(
            caches.open(STATIC_CACHE).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    const fetchPromise = fetch(request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => cachedResponse);

                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Default: Network with Cache Fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request);
            })
    );
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body || 'Episode baru tersedia!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
        },
        actions: [
            { action: 'open', title: 'Tonton Sekarang' },
            { action: 'close', title: 'Tutup' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Animeku', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there's already a window open
            for (const client of windowClients) {
                if (client.url.includes('animeku.xyz') && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Background sync for offline actions (for future use)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-watchlist') {
        event.waitUntil(syncWatchlist());
    }
});

async function syncWatchlist() {
    // Sync offline watchlist changes when back online
    console.log('[ServiceWorker] Syncing watchlist...');
}

console.log('[ServiceWorker] Loaded');
