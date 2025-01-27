// @ts-ignore
import { Context } from "https://edge.netlify.com/v1/index.ts";

// Constants
const WINDOW_SIZE = 60000; // 1 minute in milliseconds
const FREE_TIER_LIMIT = 10;
const PRO_TIER_LIMIT = 60;

// Simple in-memory store using Deno's native Map
const memoryStore = new Map<string, string>();

export default async function handler(request: Request, context: Context) {
  const ip = context.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const path = new URL(request.url).pathname;
  
  // Skip rate limiting for static assets and non-function calls
  if (!path.includes('/.netlify/functions/') || path.endsWith('.ico')) {
    return context.next();
  }

  // Get rate limit info from memory store
  const key = `rate_limit:${ip}`;
  let rateLimitInfo = {
    count: 0,
    timestamp: Date.now(),
    isPro: false
  };

  try {
    const stored = memoryStore.get(key);
    if (stored) {
      rateLimitInfo = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading rate limit info:', error);
  }

  const now = Date.now();

  // Reset count if window has passed
  if (now - rateLimitInfo.timestamp > WINDOW_SIZE) {
    rateLimitInfo = {
      count: 0,
      timestamp: now,
      isPro: rateLimitInfo.isPro
    };
  }

  // Check if user has pro license via header
  const proLicenseKey = request.headers.get('X-License-Key');
  if (proLicenseKey) {
    rateLimitInfo.isPro = true;
  }

  // Increment count
  rateLimitInfo.count++;

  // Set limits based on pro status
  const limit = rateLimitInfo.isPro ? PRO_TIER_LIMIT : FREE_TIER_LIMIT;
  const remaining = Math.max(0, limit - rateLimitInfo.count);

  // Store updated rate limit info
  try {
    memoryStore.set(key, JSON.stringify(rateLimitInfo));
    
    // Clean up old entries after window size using Deno's setTimeout
    setTimeout(() => {
      memoryStore.delete(key);
    }, WINDOW_SIZE);
  } catch (error) {
    console.error('Error storing rate limit info:', error);
  }

  // Return 429 if rate limit exceeded
  if (rateLimitInfo.count > limit) {
    return new Response('Rate limit exceeded. Please try again in a minute.', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (rateLimitInfo.timestamp + WINDOW_SIZE).toString(),
        'Retry-After': (WINDOW_SIZE / 1000).toString()
      }
    });
  }

  // Continue with request and add rate limit headers
  const response = await context.next();
  const headers = new Headers(response.headers);
  
  // Add rate limit headers
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', (rateLimitInfo.timestamp + WINDOW_SIZE).toString());

  return new Response(response.body, {
    status: response.status,
    headers
  });
} 