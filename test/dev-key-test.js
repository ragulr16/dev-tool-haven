// Test script to verify DEV-TEST-2024 key functionality
async function testDevKey() {
  const baseUrl = 'http://localhost:8889'
  const devKey = 'DEV-TEST-2024'
  
  console.log('1. Testing Backend License Validation...')
  try {
    console.log('Making request to:', `${baseUrl}/.netlify/functions/validate-license`)
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'X-License-Key': devKey
    })
    console.log('Body:', JSON.stringify({ licenseKey: devKey }, null, 2))
    
    const licenseResponse = await fetch(`${baseUrl}/.netlify/functions/validate-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-License-Key': devKey
      },
      body: JSON.stringify({ licenseKey: devKey })
    })
    
    console.log('Response status:', licenseResponse.status)
    console.log('Response headers:', Object.fromEntries(licenseResponse.headers))
    
    const text = await licenseResponse.text()
    console.log('Raw response:', text)
    
    if (text) {
      const licenseData = JSON.parse(text)
      console.log('License Validation Response:', licenseData)
      console.log('Success:', licenseData.success === true ? '✅' : '❌')
    }
  } catch (error) {
    console.error('License validation failed:', error)
  }
  
  console.log('\n2. Testing Rate Limiting with Dev Key...')
  try {
    // Make multiple requests to test rate limiting
    for (let i = 1; i <= 15; i++) {
      const response = await fetch(baseUrl, {
        headers: {
          'X-License-Key': devKey
        }
      })
      
      console.log(`Request ${i}:`)
      console.log('  Status:', response.status)
      console.log('  Remaining:', response.headers.get('X-RateLimit-Remaining'))
      console.log('  Limit:', response.headers.get('X-RateLimit-Limit'))
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  } catch (error) {
    console.error('Rate limit test failed:', error)
  }
}

console.log('Starting Dev Key Tests...\n')
testDevKey().catch(console.error) 