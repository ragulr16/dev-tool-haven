import chromium from 'chrome-aws-lambda'
import { trackEvent } from './middleware/analytics'

export default async (event) => {
  const { html, licenseKey } = JSON.parse(event.body)
  
  // Validate license
  const { valid } = await checkProLicense({ body: JSON.stringify({ licenseKey }) })
  if (!valid) return { statusCode: 403 }
  
  const browser = await chromium.puppeteer.launch()
  const page = await browser.newPage()
  await page.setContent(html)
  const pdf = await page.pdf({ format: 'A4' })
  await browser.close()

  await trackEvent('pdf_generated', { size: pdf.length })
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/pdf' },
    body: pdf.toString('base64'),
    isBase64Encoded: true
  }
} 