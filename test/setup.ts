import '@testing-library/jest-dom/vitest';
import { expect, afterEach, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { resetAllStores } from './utils';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Extend Vitest's expect with Testing Library's matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});

// Reset all stores before each test
beforeEach(() => {
  resetAllStores();
});

// Mock server setup
export const server = setupServer(
  // License validation endpoint - GET
  http.get('/.netlify/functions/validate-license', () => {
    return HttpResponse.json({ success: true });
  }),

  // License validation endpoint - POST (development)
  http.post('http://localhost:8889/.netlify/functions/validate-license', async ({ request }) => {
    const body = await request.json() as { licenseKey: string };
    const { licenseKey } = body;

    if (licenseKey === 'valid-license') {
      return HttpResponse.json({
        success: true,
        license: {
          key: licenseKey,
          type: 'pro',
          email: 'test@example.com',
          created_at: new Date().toISOString()
        }
      });
    }

    if (licenseKey === 'invalid-license') {
      return HttpResponse.json({
        success: false,
        error: 'Invalid license key'
      });
    }

    if (licenseKey === 'test-license') {
      return HttpResponse.error();
    }

    return HttpResponse.json({ success: false });
  }),

  // License validation endpoint - POST (production)
  http.post('/.netlify/functions/validate-license', async ({ request }) => {
    const body = await request.json() as { licenseKey: string };
    const { licenseKey } = body;

    if (licenseKey === 'valid-license') {
      return HttpResponse.json({
        success: true,
        license: {
          key: licenseKey,
          type: 'pro',
          email: 'test@example.com',
          created_at: new Date().toISOString()
        }
      });
    }

    if (licenseKey === 'invalid-license') {
      return HttpResponse.json({
        success: false,
        error: 'Invalid license key'
      });
    }

    if (licenseKey === 'test-license') {
      return HttpResponse.error();
    }

    return HttpResponse.json({ success: false });
  }),

  // Format endpoint
  http.post('/.netlify/functions/format', () => {
    return new HttpResponse(
      JSON.stringify({ result: 'decoded' }),
      {
        headers: {
          'x-ratelimit-limit': '60',
          'x-ratelimit-remaining': '59',
          'Content-Type': 'application/json'
        }
      }
    );
  })
);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Clean up after all tests
afterAll(() => server.close());

// Mock cookies
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock toast
vi.mock('../src/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
})); 