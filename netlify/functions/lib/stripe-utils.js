"use strict";
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY must be set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-08-16',
    typescript: true,
});

export async function verifySubscription(customerId) {
    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
            limit: 1,
        });

        if (subscriptions.data.length === 0) {
            return {
                isActive: false,
                customerId,
                subscriptionId: null,
                error: 'No active subscription found',
            };
        }

        const subscription = subscriptions.data[0];
        return {
            isActive: true,
            customerId,
            subscriptionId: subscription.id,
        };
    } catch (error) {
        console.error('Error verifying subscription:', error);
        return {
            isActive: false,
            customerId: null,
            subscriptionId: null,
            error: error instanceof Error ? error.message : 'Failed to verify subscription',
        };
    }
}

export async function createCheckoutSession(priceId, customerId) {
    if (!process.env.URL) {
        throw new Error('URL environment variable is required');
    }

    try {
        const sessionConfig = {
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.URL}/pro?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.URL}/pricing`,
            allow_promotion_codes: true,
            billing_address_collection: 'required',
        };

        // Only add customer if it's a valid string
        if (typeof customerId === 'string' && customerId.trim()) {
            sessionConfig.customer = customerId;
        } else {
            sessionConfig.customer_creation = 'always';
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);
        return { sessionId: session.id };
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

export async function handleWebhook(signature, payload) {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET is required');
    }

    try {
        const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                const subscription = event.data.object;
                console.log('Subscription updated:', subscription.id);
                break;
            case 'customer.subscription.deleted':
                console.log('Subscription cancelled:', event.data.object.id);
                break;
            default:
                console.log('Unhandled event type:', event.type);
        }

        return { success: true };
    } catch (error) {
        console.error('Error handling webhook:', error);
        throw error;
    }
}
