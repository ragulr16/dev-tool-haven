async function testRateLimits() {
  const baseUrl = 'http://localhost:8889'
  
  console.log('Testing Free Tier Rate Limits (10 req/min)...')
  for (let i = 1; i <= 12; i++) {
    const response = await fetch(baseUrl)
    const remaining = response.headers.get('X-RateLimit-Remaining')
    const limit = response.headers.get('X-RateLimit-Limit')
    const reset = new Date(parseInt(response.headers.get('X-RateLimit-Reset'))).toLocaleTimeString()
    
    console.log(`Request ${i}:`)
    console.log(`  Status: ${response.status}`)
    console.log(`  Remaining: ${remaining}/${limit}`)
    console.log(`  Resets at: ${reset}`)
    console.log('---')
    
    // Small delay to see the output clearly
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\nTesting Pro Tier Rate Limits (60 req/min)...')
  for (let i = 1; i <= 12; i++) {
    const response = await fetch(baseUrl, {
      headers: {
        'X-License-Key': 'DEV-TEST-2024'
      }
    })
    const remaining = response.headers.get('X-RateLimit-Remaining')
    const limit = response.headers.get('X-RateLimit-Limit')
    const reset = new Date(parseInt(response.headers.get('X-RateLimit-Reset'))).toLocaleTimeString()
    
    console.log(`Request ${i}:`)
    console.log(`  Status: ${response.status}`)
    console.log(`  Remaining: ${remaining}/${limit}`)
    console.log(`  Resets at: ${reset}`)
    console.log('---')
    
    // Small delay to see the output clearly
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

testRateLimits().catch(console.error) 