import fetch from 'node-fetch'

export async function handler(event) {
  const { licenseKey } = JSON.parse(event.body)
  
  // Gumroad API integration
  const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
    method: 'POST',
    body: JSON.stringify({
      product_id: process.env.GUMROAD_PRODUCT_ID,
      license_key: licenseKey
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GUMROAD_API_KEY}`
    }
  })

  const data = await response.json()
  return {
    statusCode: response.status,
    body: JSON.stringify({
      valid: data.success,
      expires: data.license?.end_date
    })
  }
} 