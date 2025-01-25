import { Handler } from '@netlify/functions';

// Special development mode test key
const DEV_TEST_KEY = 'DEV-TEST-2024';

// CORS headers for development
const getCorsHeaders = (event: any) => ({
  'Access-Control-Allow-Origin': event.headers.origin || 'http://localhost:8080',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-License-Key',
  'Access-Control-Max-Age': '86400',
});

interface GumroadResponse {
  success: boolean;
  purchase: {
    seller_id: string;
    product_id: string;
    license_key: string;
    email: string;
    price: number;
    currency: string;
    quantity: number;
    created_at: string;
    refunded: boolean;
    chargebacked: boolean;
    subscription_ended_at: string | null;
    subscription_cancelled_at: string | null;
  };
}

export const handler: Handler = async (event) => {
  const corsHeaders = getCorsHeaders(event);

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const { licenseKey } = JSON.parse(event.body || '{}');
    
    console.log('Received license key:', licenseKey);
    console.log('Environment:', {
      NETLIFY_DEV: process.env.NETLIFY_DEV,
      NETLIFY_LOCAL: process.env.NETLIFY_LOCAL,
      NODE_ENV: process.env.NODE_ENV
    });
    
    if (!licenseKey) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: false, error: 'License key is required' })
      };
    }

    // Special handling for development test key
    if (licenseKey === DEV_TEST_KEY) {
      console.log('Development key detected, validating...');
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          license: {
            key: DEV_TEST_KEY,
            type: 'development',
            email: 'dev@example.com',
            created_at: new Date().toISOString()
          }
        })
      };
    }

    console.log('Proceeding with Gumroad validation...');

    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GUMROAD_API_KEY}`,
      },
      body: JSON.stringify({
        product_permalink: process.env.GUMROAD_PRODUCT_PERMALINK,
        license_key: licenseKey,
      }),
    });

    const data: GumroadResponse = await gumroadResponse.json();

    if (!data.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid license key' }),
      };
    }

    // Check if subscription is active (not ended or cancelled)
    const isActive = !data.purchase.refunded && 
                    !data.purchase.chargebacked && 
                    !data.purchase.subscription_ended_at && 
                    !data.purchase.subscription_cancelled_at;

    if (!isActive) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'License key is inactive or expired' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        email: data.purchase.email,
        created_at: data.purchase.created_at,
      }),
    };
  } catch (error) {
    console.error('License validation error:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, error: 'Internal server error' })
    };
  }
};

// Add subscription status check
export async function validateLicense(licenseKey: string) {
  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      body: new URLSearchParams({
        product_permalink: 'DEV_TOOLS_PRO',
        license_key: licenseKey,
      })
    });

    const data = await response.json();
    
    // Modified validation logic
    return data.success && 
           data.purchase.subscription_cancelled_at === null && // Add subscription check
           !data.purchase.refunded && // Check for refunds
           new Date(data.purchase.subscription_ended_at) > new Date(); // Check subscription end date
  } catch (error) {
    console.error('License validation failed:', error);
    return false;
  }
} 