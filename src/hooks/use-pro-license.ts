import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { useState, useEffect } from 'react';

interface ProLicenseState {
  hasProLicense: boolean;
  isLoading: boolean;
  error: string | null;
}

// Special development mode test key
const DEV_TEST_KEY = 'DEV-TEST-2024';

const isDevelopmentTestKey = (key: string | null): boolean => {
  return import.meta.env.DEV && key === DEV_TEST_KEY;
};

export const useProLicense = () => {
  const [state, setState] = useState<ProLicenseState>({
    hasProLicense: false,
    isLoading: true,
    error: null,
  });

  const [licenseKey, setLicenseKey] = useState<string | null>(() => {
    const storedKey = Cookies.get('pro_license');
    console.log('[useProLicense] Initial stored key:', storedKey);
    console.log('[useProLicense] Is dev mode?', import.meta.env.DEV);
    return storedKey === DEV_TEST_KEY ? storedKey : null;
  });

  // Set initial pro status
  useEffect(() => {
    console.log('[useProLicense] Effect - Current license key:', licenseKey);
    console.log('[useProLicense] Effect - Is dev key?', licenseKey === DEV_TEST_KEY);
    if (licenseKey === DEV_TEST_KEY) {
      console.log('[useProLicense] Effect - Activating dev key');
      setState({
        hasProLicense: true,
        isLoading: false,
        error: null,
      });
    }
  }, [licenseKey]);

  const handleSetLicenseKey = (key: string | null) => {
    console.log('[useProLicense] handleSetLicenseKey called with:', key);
    console.log('[useProLicense] Current state:', { hasProLicense: state.hasProLicense, licenseKey });
    
    if (!key) {
      console.log('[useProLicense] Clearing license key');
      Cookies.remove('pro_license');
      setLicenseKey(null);
      setState({
        hasProLicense: false,
        isLoading: false,
        error: key === null ? 'License key cleared' : null,
      });
      return;
    }

    // Immediately activate dev key
    if (key === DEV_TEST_KEY) {
      console.log('[useProLicense] Setting dev key');
      Cookies.set('pro_license', key, { expires: 365 });
      setLicenseKey(key);
      setState({
        hasProLicense: true,
        isLoading: false,
        error: null,
      });
      return;
    }

    console.log('[useProLicense] Setting regular license key');
    Cookies.set('pro_license', key, { expires: 365 });
    setLicenseKey(key);
    setState({
      hasProLicense: true,
      isLoading: true,
      error: null,
    });
  };

  const validateLicenseKey = async (key: string | null): Promise<boolean> => {
    if (!key) {
      handleSetLicenseKey(null);
      return false;
    }

    // Handle dev test key
    if (isDevelopmentTestKey(key)) {
      handleSetLicenseKey(key);
      return true;
    }

    try {
      const response = await fetch('/.netlify/functions/validate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key })
      });

      const data = await response.json();
      
      if (data.success) {
        handleSetLicenseKey(key);
        return true;
      }
      
      // Clear license key if validation fails
      handleSetLicenseKey(null);
      return false;
    } catch (error) {
      console.error('[useProLicense] License validation error:', error);
      // Clear license key on error
      handleSetLicenseKey(null);
      return false;
    }
  };

  const validateLicense = async () => {
    console.log('[useProLicense] Validating current key:', licenseKey);
    
    if (!licenseKey) {
      console.log('[useProLicense] No current key');
      handleSetLicenseKey(null);
      return false;
    }

    // Immediately validate dev key without server request
    if (licenseKey === DEV_TEST_KEY) {
      console.log('[useProLicense] Found dev key, activating...');
      handleSetLicenseKey(licenseKey);
      return true;
    }

    try {
      console.log('[useProLicense] Making server validation request');
      const baseUrl = import.meta.env.DEV ? 'http://localhost:8889' : '';
      const response = await fetch(`${baseUrl}/.netlify/functions/validate-license`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });

      if (!response.ok) {
        console.log('[useProLicense] Server returned error status');
        handleSetLicenseKey(null);
        setState(prev => ({
          ...prev,
          hasProLicense: false,
          error: 'License validation failed'
        }));
        return false;
      }

      const data = await response.json();
      console.log('[useProLicense] License validation response:', data);

      if (data.success) {
        console.log('[useProLicense] Server validation successful');
        setState(prev => ({
          ...prev,
          hasProLicense: true,
          error: null
        }));
        return true;
      } else {
        console.log('[useProLicense] Server validation failed');
        handleSetLicenseKey(null);
        setState(prev => ({
          ...prev,
          hasProLicense: false,
          error: data.error || 'Invalid license key'
        }));
        return false;
      }
    } catch (error) {
      console.error('[useProLicense] Validation error:', error);
      handleSetLicenseKey(null);
      setState(prev => ({
        ...prev,
        hasProLicense: false,
        error: 'License validation failed'
      }));
      return false;
    }
  };

  const clearLicense = () => {
    handleSetLicenseKey(null);
  };

  useEffect(() => {
    const validate = async () => {
      try {
        const response = await fetch('/.netlify/functions/validate-license');
        
        if (!response.ok) throw new Error('Validation failed');
        
        const data = await response.json();
        setState({
          hasProLicense: data.isValid,
          isLoading: false,
          error: data.error || null,
        });
      } catch (error) {
        setState({
          hasProLicense: false,
          isLoading: false,
          error: error.message || 'License check failed',
        });
      }
    };

    validate();
  }, []);

  return {
    ...state,
    licenseKey,
    setLicenseKey: handleSetLicenseKey,
    validateLicense,
    clearLicense,
    isPro: state.hasProLicense
  };
};