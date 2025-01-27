import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'GUMROAD_ACCESS_TOKEN',
  'GUMROAD_PRODUCT_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

async function testGumroadOAuth() {
  // Netlify Functions run on port 8888 by default in development
  const baseUrl = process.env.NETLIFY_URL || 'http://localhost:8888';
  console.log('🧪 Testing Gumroad OAuth Integration...\n');
  console.log('Using base URL:', baseUrl);

  // Test Data
  const testCases = [
    {
      name: '1. Test Mode License',
      licenseKey: 'TEST-123',
      expectSuccess: true
    },
    {
      name: '2. Invalid License Key',
      licenseKey: 'INVALID-KEY',
      expectSuccess: false
    }
  ];

  try {
    // 1. First verify OAuth token is valid
    console.log('\nChecking OAuth Access Token...');
    const tokenCheck = await fetch('https://api.gumroad.com/v2/user', {
      headers: {
        'Authorization': `Bearer ${process.env.GUMROAD_ACCESS_TOKEN}`
      }
    });
    
    const tokenData = await tokenCheck.json();
    console.log('Token check response:', tokenData);
    
    if (!tokenData.success) {
      throw new Error('OAuth token validation failed. Please check your GUMROAD_ACCESS_TOKEN');
    }
    console.log('✅ OAuth token is valid\n');

    // Wait for Netlify Functions to be ready
    console.log('Waiting for Netlify Functions to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Run test cases
    for (const test of testCases) {
      console.log(`Running ${test.name}...`);
      
      try {
        const response = await fetch(`${baseUrl}/.netlify/functions/auth-pro`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ licenseKey: test.licenseKey })
        });

        const data = await response.json();
        
        // For success case, we expect valid=true
        // For error case, we expect error response
        const isSuccess = response.status === 200 && data.valid === true;
        
        console.log('Response:', {
          status: response.status,
          success: isSuccess === test.expectSuccess,
          data: data
        });

        if (isSuccess === test.expectSuccess) {
          console.log('✅ Test passed\n');
        } else {
          console.log('❌ Test failed\n');
          console.log('Expected success:', test.expectSuccess);
          console.log('Got success:', isSuccess);
          console.log('Full response:', data);
        }
      } catch (error) {
        console.error(`❌ Test "${test.name}" failed with error:`, error);
        console.error('Full error:', error);
      }

      // Add a small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 3. Test rate limiting
    console.log('\nTesting rate limiting...');
    const results = [];
    
    // Make requests sequentially to ensure accurate rate limiting
    for (let i = 0; i < 15; i++) {
      console.log(`Making request ${i + 1}/15...`);
      const response = await fetch(`${baseUrl}/.netlify/functions/auth-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ licenseKey: 'TEST-123' })
      });
      
      results.push(response.status);
      
      // Small delay between requests to allow rate limit to be enforced
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const rateLimited = results.some(status => status === 429);
    const rateLimitCount = results.filter(status => status === 429).length;
    
    console.log('\nRate limiting results:');
    console.log('Rate limiting:', rateLimited ? '✅ Working' : '❌ Not working');
    console.log('Total requests:', results.length);
    console.log('Rate limited requests:', rateLimitCount);
    console.log('Response status codes:', results);

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Full error details:', error);
    process.exit(1);
  }
}

// Run tests
console.log('Starting Gumroad OAuth Integration Tests...\n');
testGumroadOAuth().catch(error => {
  console.error('❌ Unhandled error:', error);
  console.error('Full error details:', error);
  process.exit(1);
}); 