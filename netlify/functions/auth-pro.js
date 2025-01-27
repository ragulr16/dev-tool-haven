import fetch from 'node-fetch'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { licenseKey } = JSON.parse(event.body)
    
    if (!licenseKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'License key is required' })
      }
    }

    // Get OAuth token from cookie or environment variable
    const cookies = event.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    const accessToken = cookies?.gumroad_access_token || process.env.GUMROAD_ACCESS_TOKEN;

    if (!accessToken && !licenseKey.startsWith('TEST-')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authentication required' })
      }
    }

    console.log('License verification attempt:', { 
      licenseKey,
      productId: process.env.GUMROAD_PRODUCT_ID,
      environment: process.env.NODE_ENV,
      isTestMode: licenseKey.startsWith('TEST-'),
      hasAccessToken: !!accessToken
    })

    // Handle test mode license keys
    if (licenseKey.startsWith('DEV-TEST-')) {
      console.log('Development test key detected')
      return {
        statusCode: 200,
        body: JSON.stringify({
          valid: true,
          purchase: {
            id: 'test-purchase',
            email: 'test@example.com',
            created_at: new Date().toISOString(),
            test: true
          }
        })
      }
    }

    // Gumroad API integration with OAuth
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        product_permalink: process.env.GUMROAD_PRODUCT_PERMALINK,
        license_key: licenseKey,
        increment_uses_count: true
      })
    })

    const data = await response.json()
    console.log('Gumroad API full response:', JSON.stringify(data, null, 2))

    // Check for specific Gumroad error responses
    if (data.success === false) {
      console.log('License validation failed:', data.message)
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid license',
          message: data.message || 'License verification failed',
          code: 'INVALID_LICENSE'
        })
      }
    }

    // Verify the purchase is valid and not refunded
    if (data.purchase?.refunded || data.purchase?.chargebacked) {
      console.log('License refunded or chargebacked:', {
        refunded: data.purchase?.refunded,
        chargebacked: data.purchase?.chargebacked
      })
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'License refunded',
          message: 'This license has been refunded or charged back',
          code: 'LICENSE_REFUNDED'
        })
      }
    }

    console.log('License validated successfully:', {
      purchaseId: data.purchase?.id,
      email: data.purchase?.email,
      test: data.purchase?.test || false
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: true,
        purchase: {
          id: data.purchase?.id,
          email: data.purchase?.email,
          created_at: data.purchase?.created_at,
          uses: data.uses,
          test: data.purchase?.test || false
        }
      })
    }
  } catch (error) {
    console.error('License verification error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        code: 'SERVER_ERROR'
      })
    }
  }
} 