import { Handler } from '@netlify/functions';
import { verifySubscription } from './lib/stripe-utils.mjs';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { customerId } = JSON.parse(event.body || '{}');

    if (!customerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Customer ID is required' }),
      };
    }

    const subscriptionStatus = await verifySubscription(customerId);

    return {
      statusCode: 200,
      body: JSON.stringify(subscriptionStatus),
    };
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to verify subscription' }),
    };
  }
}; 