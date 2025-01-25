import { checkProLicense } from '../lib/license-utils.js'

// CORS headers for development
const getCorsHeaders = (request) => ({
  'Access-Control-Allow-Origin': request.headers.get('origin') || 'http://localhost:8080',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-License-Key',
  'Access-Control-Max-Age': '86400',
});

export default async (request, context) => {
  const corsHeaders = getCorsHeaders(request);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Skip rate limiting for the license validation endpoint
  if (request.url.includes('/.netlify/functions/validate-license')) {
    return context.next();
  }

  const ip = context.ip;
  const cacheKey = new URL(`https://rate-limit.local/${ip.replace(/[^a-zA-Z0-9]/g, '_')}`);
  
  // Get current timestamp
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute ago
  
  // Get or initialize the request counter from cache
  let requests = [];
  const cache = await caches.open('rate-limits');
  const cached = await cache.match(cacheKey);
  
  if (cached) {
    try {
      requests = await cached.json();
    } catch (e) {
      requests = [];
    }
  }
  
  // Filter out old requests
  requests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if user is pro
  const isPro = await checkProLicense(request.headers.get('X-License-Key'), context.env);
  const limit = isPro ? 60 : 10;
  
  // Add rate limit headers
  const rateLimitHeaders = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, limit - requests.length).toString(),
    'X-RateLimit-Reset': (windowStart + 60000).toString()
  };
  
  if (requests.length >= limit) {
    return new Response('Rate limit exceeded', { 
      status: 429,
      headers: {
        ...corsHeaders,
        ...rateLimitHeaders,
        'Content-Type': 'text/plain',
        'Retry-After': '60'
      }
    });
  }
  
  // Add current request timestamp
  requests.push(now);
  
  // Store updated requests in cache
  await cache.put(
    cacheKey, 
    new Response(JSON.stringify(requests), {
      headers: {
        'Cache-Control': 'max-age=60'
      }
    })
  );
  
  // Continue with the request and add rate limit headers
  const response = await context.next();
  const newResponse = new Response(response.body, response);
  
  // Add rate limit headers to the response
  Object.entries({ ...corsHeaders, ...rateLimitHeaders }).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  
  return newResponse;
}; 