import { Handler, HandlerEvent } from '@netlify/functions';
import { createCheckoutSession } from './lib/stripe-utils.mjs';

export const handler: Handler = async (event: HandlerEvent) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    let customerId: string | undefined;
    let body;
    
    try {
      body = JSON.parse(event.body);
      // Only set customerId if it's a valid string
      if (typeof body.customerId === 'string' && body.customerId.trim()) {
        customerId = body.customerId.trim();
      }
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'STRIPE_PRICE_ID is not configured' }),
      };
    }

    const { sessionId } = await createCheckoutSession(
      process.env.STRIPE_PRICE_ID,
      customerId
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId }),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error creating checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }),
    };
  }
}; 