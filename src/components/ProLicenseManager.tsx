import React, { useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { useProLicense } from '../hooks/use-pro-license';

// Initialize Stripe outside of component to avoid re-initialization
let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      throw new Error('Stripe publishable key not found');
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export function ProLicenseManager() {
  const { isPro, customerId, setCustomerId, validateSubscription, clearSubscription } = useProLicense();
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for successful Stripe redirect
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get('session_id');
    
    if (sessionId) {
      setIsLoading(true);
      validateSubscription().then((success) => {
        if (success) {
          toast({
            title: 'Subscription Activated!',
            description: 'You now have access to all Pro features.',
          });
        }
        setIsLoading(false);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }).catch((error) => {
        console.error('Validation error:', error);
        toast({
          title: 'Validation Error',
          description: 'Failed to validate subscription. Please contact support.',
          variant: 'destructive',
        });
        setIsLoading(false);
      });
    }
  }, [validateSubscription, toast]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create checkout session');
      }

      const stripe = await getStripe();
      
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription Error',
        description: error instanceof Error ? error.message : 'Failed to start subscription process. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Pro License Status</h2>
      
      {isPro ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-green-500">●</span>
            <span>Active Pro Subscription</span>
          </div>
          <Button
            variant="outline"
            onClick={clearSubscription}
            disabled={isLoading}
          >
            Manage Subscription
          </Button>
        </div>
      ) : (
        <div>
          <p className="mb-4">
            Upgrade to Pro to unlock all features and support development.
          </p>
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Subscribe to Pro - $5/month'}
          </Button>
        </div>
      )}
    </div>
  );
} 