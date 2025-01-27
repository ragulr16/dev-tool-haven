import fetch from 'node-fetch';

// OAuth configuration
const config = {
  clientId: process.env.GUMROAD_CLIENT_ID,
  clientSecret: process.env.GUMROAD_CLIENT_SECRET,
  redirectUri: process.env.GUMROAD_OAUTH_REDIRECT_URI,
  authUrl: 'https://gumroad.com/oauth/authorize',
  tokenUrl: 'https://api.gumroad.com/oauth/token',
};

export async function handler(event) {
  const { code, error } = event.queryStringParameters || {};

  // Handle OAuth errors
  if (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error, message: 'OAuth authorization failed' })
    };
  }

  // Initial OAuth request - redirect to Gumroad
  if (!code) {
    const scope = 'view_profile edit_products view_sales';
    const authUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
    
    return {
      statusCode: 302,
      headers: {
        Location: authUrl,
      },
    };
  }

  // Exchange code for access token
  try {
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'token_exchange_failed',
          message: tokenData.error || 'Failed to exchange authorization code for token'
        })
      };
    }

    // Store the access token securely (you might want to use a more secure storage in production)
    // Here we're setting it as an HttpOnly cookie
    const cookieOptions = [
      `gumroad_access_token=${tokenData.access_token}`,
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Path=/',
      'Max-Age=2592000' // 30 days
    ].join(';');

    return {
      statusCode: 302,
      headers: {
        'Set-Cookie': cookieOptions,
        'Location': '/' // Redirect to your app's home page
      },
    };

  } catch (error) {
    console.error('OAuth error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'oauth_error',
        message: 'An error occurred during OAuth authentication'
      })
    };
  }
} 