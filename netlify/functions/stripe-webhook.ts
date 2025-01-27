import { Handler } from '@netlify/functions';
import { handleWebhook } from './lib/stripe-utils.mjs';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const signature = event.headers['stripe-signature'];

  if (!signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing stripe-signature header' }),
    };
  }

  try {
    await handleWebhook(signature, event.body || '');

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error handling webhook:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook Error' }),
    };
  }
}; 