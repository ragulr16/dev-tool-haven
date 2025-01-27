import { describe, it, expect, beforeAll } from 'vitest';
import { server } from './setup';
import { fetch } from 'msw';

const TEST_LICENSE_KEY = 'TEST-2024-INTEGRATION';
const BASE_URL = 'http://localhost:8888';

describe('Gumroad Integration Tests', () => {
  beforeAll(() => {
    // Ensure test environment
    if (!process.env.GUMROAD_ACCESS_TOKEN) {
      throw new Error('GUMROAD_ACCESS_TOKEN is required for integration tests');
    }
  });

  it('should verify test purchase flow', async () => {
    // Step 1: Verify Gumroad API connection
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/products', {
      headers: {
        'Authorization': `Bearer ${process.env.GUMROAD_ACCESS_TOKEN}`
      }
    });
    const gumroadData = await gumroadResponse.json();
    expect(gumroadData.success).toBe(true);
    expect(gumroadData.products[0].id).toBe(process.env.GUMROAD_PRODUCT_ID);

    // Step 2: Test license validation endpoint
    const validationResponse = await fetch(`${BASE_URL}/.netlify/functions/auth-pro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        licenseKey: TEST_LICENSE_KEY
      })
    });
    const validationData = await validationResponse.json();
    
    // Should accept test license key
    expect(validationData.valid).toBe(true);
    expect(validationData.purchase.test).toBe(true);
  });

  it('should handle Gumroad webhook', async () => {
    const webhookPayload = {
      seller_id: process.env.GUMROAD_APPLICATION_ID,
      product_id: process.env.GUMROAD_PRODUCT_ID,
      license_key: TEST_LICENSE_KEY,
      test: true
    };

    const webhookResponse = await fetch(`${BASE_URL}/.netlify/functions/gumroad-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookData = await webhookResponse.json();
    expect(webhookData.success).toBe(true);
  });

  it('should validate various license key formats', async () => {
    const testCases = [
      { key: TEST_LICENSE_KEY, expectValid: true },
      { key: 'INVALID-KEY', expectValid: false },
      { key: '', expectValid: false },
      { key: 'TEST-' + Date.now(), expectValid: true }
    ];

    for (const testCase of testCases) {
      const response = await fetch(`${BASE_URL}/.netlify/functions/auth-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseKey: testCase.key
        })
      });

      if (testCase.expectValid) {
        const data = await response.json();
        expect(data.valid).toBe(true);
        expect(data.purchase).toBeDefined();
      } else {
        expect(response.ok).toBe(false);
      }
    }
  });
}); 