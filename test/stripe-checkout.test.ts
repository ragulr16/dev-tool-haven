import './setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock function
const createMock = vi.hoisted(() => vi.fn().mockResolvedValue({
  id: 'cs_test_mock'
}));

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: createMock
      }
    }
  }))
}));

// Import after mocks are set up
import { createCheckoutSession } from '../netlify/functions/lib/stripe-utils.mjs';

describe('Stripe Checkout Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a checkout session with correct configuration', async () => {
    const session = await createCheckoutSession(process.env.STRIPE_PRICE_ID);
    expect(session).toEqual({
      sessionId: 'cs_test_mock'
    });
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }],
      success_url: 'http://localhost:8888/pro?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:8888/pricing'
    }));
  });

  it('creates a checkout session with customer ID', async () => {
    const session = await createCheckoutSession(process.env.STRIPE_PRICE_ID, 'cus_mock');
    expect(session).toEqual({
      sessionId: 'cs_test_mock'
    });
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_mock'
    }));
  });

  it('handles empty customer ID gracefully', async () => {
    const session = await createCheckoutSession(process.env.STRIPE_PRICE_ID, '');
    expect(session).toEqual({
      sessionId: 'cs_test_mock'
    });
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      customer_creation: 'always'
    }));
  });

  it('includes required billing address collection', async () => {
    await createCheckoutSession(process.env.STRIPE_PRICE_ID);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      billing_address_collection: 'required'
    }));
  });

  it('allows promotion codes', async () => {
    await createCheckoutSession(process.env.STRIPE_PRICE_ID);
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      allow_promotion_codes: true
    }));
  });

  it('handles Stripe API errors', async () => {
    createMock.mockRejectedValueOnce(new Error('Stripe API Error'));
    await expect(createCheckoutSession(process.env.STRIPE_PRICE_ID)).rejects.toThrow('Stripe API Error');
  });
}); 