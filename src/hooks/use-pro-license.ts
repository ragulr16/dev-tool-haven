import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

// Special development mode test key
const DEV_TEST_KEY = 'DEV-TEST-2024';

interface ProLicenseState {
  isPro: boolean;
  customerId: string | null;
  subscriptionId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Auto-enable pro features in development mode
const isDevelopment = import.meta.env.DEV;

export function useProLicense() {
  const [state, setState] = useState<ProLicenseState>({
    isPro: false,
    customerId: Cookies.get('stripe_customer_id') || null,
    subscriptionId: null,
    isLoading: true,
    error: null,
  });

  const [licenseKey, setLicenseKey] = useState<string | null>(() => {
    // Check for dev test key in cookies
    const storedKey = Cookies.get('pro_license');
    if (isDevelopment && (!storedKey || storedKey === DEV_TEST_KEY)) {
      Cookies.set('pro_license', DEV_TEST_KEY, { expires: 365 });
      return DEV_TEST_KEY;
    }
    return storedKey || null;
  });

  const setCustomerId = (id: string) => {
    Cookies.set('stripe_customer_id', id, { expires: 365 });
    setState(prev => ({ ...prev, customerId: id }));
  };

  const validateSubscription = async () => {
    if (!state.customerId) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch('/.netlify/functions/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: state.customerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify subscription');
      }

      setState(prev => ({
        ...prev,
        isPro: data.isActive,
        subscriptionId: data.subscriptionId,
        isLoading: false,
      }));

      return data.isActive;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isPro: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      }));
      return false;
    }
  };

  const clearSubscription = () => {
    Cookies.remove('stripe_customer_id');
    setState({
      isPro: false,
      customerId: null,
      subscriptionId: null,
      isLoading: false,
      error: null,
    });
  };

  // Initial validation
  useEffect(() => {
    if (state.customerId) {
      validateSubscription();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.customerId]);

  const handleSetLicenseKey = (key: string | null) => {
    if (!key) {
      Cookies.remove('pro_license');
      setLicenseKey(null);
      setState({
        isPro: false,
        customerId: null,
        subscriptionId: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Special handling for development mode
    if (isDevelopment || key === DEV_TEST_KEY) {
      Cookies.set('pro_license', key, { expires: 365 });
      setLicenseKey(key);
      setState({
        isPro: true,
        customerId: null,
        subscriptionId: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Set the key and let the useEffect handle validation
    Cookies.set('pro_license', key, { expires: 365 });
    setLicenseKey(key);
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));
  };

  const validateLicense = async () => {
    if (!licenseKey) {
      return false;
    }

    // Special handling for development mode
    if (isDevelopment || licenseKey === DEV_TEST_KEY) {
      setState({
        isPro: true,
        customerId: null,
        subscriptionId: null,
        isLoading: false,
        error: null,
      });
      return true;
    }

    try {
      const response = await fetch('/.netlify/functions/auth-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setState(prev => ({
          ...prev,
          isPro: true,
          error: null
        }));
        return true;
      } else {
        handleSetLicenseKey(null);
        return false;
      }
    } catch (error) {
      console.error('[useProLicense] Validation error:', error);
      handleSetLicenseKey(null);
      return false;
    }
  };

  const clearLicense = () => {
    handleSetLicenseKey(null);
  };

  return {
    ...state,
    licenseKey,
    setLicenseKey: handleSetLicenseKey,
    validateLicense,
    clearLicense,
    setCustomerId,
    validateSubscription,
    clearSubscription,
  };
}