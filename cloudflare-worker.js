export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const userAgent = request.headers.get('User-Agent') || '';

    const BACKEND_URL = 'https://api.animeku.xyz';
    
    // Detect crawlers/bots untuk SSR
    const isCrawler = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Googlebot|bingbot|Slurp|DuckDuckBot|Applebot/i.test(userAgent);

    // SSR Routes - Hanya untuk crawlers
    if ((path.match(/^\/anime\/[^\/]+/) || path.match(/^\/watch\/[^\/]+/)) && isCrawler) {
      const backendUrl = BACKEND_URL + path + url.search;
      
      try {
        const response = await fetch(backendUrl, {
          method: request.method,
          headers: {
            'Host': 'api.animeku.xyz',
            'Accept': 'text/html',
            'User-Agent': userAgent,
          }
        });
        
        return new Response(response.body, {
          status: response.status,
          headers: response.headers
        });
      } catch (err) {
        console.error('Backend error:', err);
      }
    }

    // API Routes - Proxy ke backend
    if (path.startsWith('/api/') || path.startsWith('/socket.io/')) {
      const backendUrl = BACKEND_URL + path + url.search;
      const response = await fetch(backendUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      });
    }

    // Static Files dari R2 (untuk browser SPA)
    let objectPath = path.slice(1) || 'index.html';
    let object = await env.BUCKET.get(objectPath);
    if (!object && !objectPath.includes('.')) {
      object = await env.BUCKET.get('index.html');
    }
    if (!object) return new Response('Not found', { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    return new Response(object.body, { headers });
  }
};