import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import '@testing-library/jest-dom/vitest';
import { expect, afterEach, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { resetAllStores } from './utils';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import 'isomorphic-fetch';

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

// Add fetch to global scope
if (!global.fetch) {
  global.fetch = fetch as any;
}

// Define handlers for test endpoints
const handlers = [
  // Stripe API handlers
  http.post('/.netlify/functions/create-checkout', async ({ request }) => {
    return HttpResponse.json({
      sessionId: 'cs_test_mock'
    });
  })
];

// Create MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

// Reset handlers after each test
afterEach(() => server.resetHandlers());

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