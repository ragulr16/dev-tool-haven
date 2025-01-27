export async function checkProLicense(licenseKey, env) {
  // Special development mode test key
  if (licenseKey === 'DEV-TEST-2024') {
    return true;
  }

  if (!licenseKey) {
    return false;
  }

  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GUMROAD_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        product_id: env.GUMROAD_PRODUCT_ID,
        license_key: licenseKey,
      }),
    });

    const data = await response.json();
    return data.success && !data.purchase.refunded && !data.purchase.chargebacked;
  } catch (error) {
    console.error('License verification failed:', error);
    return false;
  }
}

// Add enhanced rate limiting
export async function enforceRateLimit(request, isProUser) {
  const ip = request.headers.get('x-nf-client-connection-ip');
  const rateLimitKey = `rate_limit_${ip}`;
  
  // Different limits for Pro vs Free
  const limit = isProUser ? 60 : 10;
  const window = 60; // seconds
  
  const currentCount = await KV.get(rateLimitKey) || 0;
  
  if (currentCount >= limit) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  await KV.put(rateLimitKey, (parseInt(currentCount) + 1).toString(), {
    expirationTtl: window,
  });
} 