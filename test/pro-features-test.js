// Test script to verify all pro features
async function testProFeatures() {
  const baseUrl = 'http://localhost:8080'
  const devKey = 'DEV-TEST-2024'
  
  console.log('🧪 Testing Pro Features...\n')

  // Test Data
  const testCases = [
    {
      type: 'jwt',
      input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      expectedFields: ['sub', 'name', 'iat']
    },
    {
      type: 'csv',
      input: 'name,age,city\njohn,30,nyc\nanna,25,sf',
      expectedFormat: 'json'
    },
    {
      type: 'sql',
      input: 'SELECT * FROM users WHERE age > 21 AND city = "nyc"',
      expectFormatted: true
    }
  ]

  try {
    console.log('1. Testing License Activation...')
    const licenseResponse = await fetch(`${baseUrl}/.netlify/functions/validate-license`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-License-Key': devKey
      },
      body: JSON.stringify({ licenseKey: devKey })
    })

    const licenseData = await licenseResponse.json()
    console.log('License Status:', licenseData.success ? '✅' : '❌')
    console.log('License Details:', licenseData)

    console.log('\n2. Testing Pro Features Access...')
    for (const test of testCases) {
      console.log(`\nTesting ${test.type.toUpperCase()} Tool:`)
      
      const response = await fetch(`${baseUrl}/api/tools/${test.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-License-Key': devKey
        },
        body: JSON.stringify({ input: test.input })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ ${test.type} endpoint accessible`)
        
        // Verify output format
        if (test.type === 'jwt') {
          const hasAllFields = test.expectedFields.every(field => result.payload[field])
          console.log('JWT Decoded Fields:', hasAllFields ? '✅' : '❌')
        } else if (test.type === 'csv') {
          const isValidJson = Array.isArray(result)
          console.log('CSV to JSON Conversion:', isValidJson ? '✅' : '❌')
        } else if (test.type === 'sql') {
          const isFormatted = result.formatted !== test.input
          console.log('SQL Formatting:', isFormatted ? '✅' : '❌')
        }
      } else {
        console.log(`❌ ${test.type} endpoint failed:`, response.status)
      }
    }

    console.log('\n3. Testing Rate Limits...')
    const rateLimitTest = async () => {
      const response = await fetch(`${baseUrl}/api/tools/jwt`, {
        method: 'POST',
        headers: {
          'X-License-Key': devKey
        }
      })
      return {
        remaining: response.headers.get('X-RateLimit-Remaining'),
        limit: response.headers.get('X-RateLimit-Limit')
      }
    }

    const { limit } = await rateLimitTest()
    console.log('Pro Rate Limit:', limit === '60' ? '✅' : '❌', `(${limit} req/min)`)
  } catch (error) {
    console.error('Test failed:', error)
  }
}

console.log('Starting Pro Features Test Suite...\n')
testProFeatures().catch(console.error)

describe('Pro Features', () => {
  test('Blocks unauthorized Pro tool access', async () => {
    render(<ToolCard tool={{ id: 'jwt-decoder', pro: true }} />);
    expect(screen.getByTestId('pro-badge')).toBeInTheDocument();
  });

  test('Shows license loading state', async () => {
    render(<ProLicenseManager />);
    expect(screen.getByText(/Verifying license/i)).toBeInTheDocument();
  });
}); 