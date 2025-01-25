import React, { useEffect, useState } from 'react';
import { useProLicense } from '@/hooks/use-pro-license';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

// Special development mode test key
const DEV_TEST_KEY = 'DEV-TEST-2024';

export function ProLicenseManager() {
  const { isPro, licenseKey, setLicenseKey, validateLicense, clearLicense, hasProLicense, isLoading, error } = useProLicense();
  const [newLicenseKey, setNewLicenseKey] = React.useState('');
  const [isValidating, setIsValidating] = React.useState(false);
  const { toast } = useToast();

  console.log('[ProLicenseManager] Render state:', {
    isPro,
    licenseKey,
    newLicenseKey,
    isValidating,
    isDev: import.meta.env.DEV
  });

  // Initial validation on mount
  useEffect(() => {
    const storedKey = Cookies.get('pro_license');
    if (storedKey === DEV_TEST_KEY) {
      setLicenseKey(DEV_TEST_KEY);
    } else if (storedKey) {
      validateLicense();
    }
  }, [setLicenseKey, validateLicense]);

  const handleValidateLicense = async () => {
    if (!newLicenseKey) return;
    
    setIsValidating(true);
    try {
      if (newLicenseKey === DEV_TEST_KEY) {
        Cookies.set('pro_license', DEV_TEST_KEY, { expires: 365 });
        setLicenseKey(DEV_TEST_KEY);
        setNewLicenseKey('');
        toast({
          title: "Development License Activated",
          description: "You now have access to pro features.",
        });
      } else {
        const isValid = await validateLicense();
        if (isValid) {
          Cookies.set('pro_license', newLicenseKey, { expires: 365 });
          setLicenseKey(newLicenseKey);
          setNewLicenseKey('');
          toast({
            title: "License Validated!",
            description: "You now have access to pro features.",
          });
        } else {
          toast({
            title: "Invalid License",
            description: "Please check your license key.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to validate license. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading) return <div className="loading-license">Verifying license...</div>;

  return (
    <div className="space-y-4 p-4 rounded-lg border border-gray-700/50 bg-gray-800/30">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Pro License</h3>
        <Badge variant={isPro ? "default" : "secondary"}>
          {isPro ? "Active" : "Inactive"}
        </Badge>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {isPro ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current License Key</p>
            <code className="px-2 py-1 rounded bg-gray-900/50 text-gray-300 text-sm font-mono">
              {licenseKey || ''}
            </code>
          </div>
          <Button
            variant="destructive"
            onClick={clearLicense}
            className="w-full"
          >
            Remove License
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter license key"
              value={newLicenseKey}
              onChange={(e) => setNewLicenseKey(e.target.value)}
              disabled={isValidating}
            />
            <Button
              onClick={handleValidateLicense}
              disabled={!newLicenseKey || isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating
                </>
              ) : (
                "Validate"
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-400">
            Don't have a license?{" "}
            <a
              href="https://gumroad.com/l/dev-tools-pro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Purchase Pro
            </a>
            <br />
            <span className="text-yellow-400">
              Development mode: Use "{DEV_TEST_KEY}" for testing
            </span>
          </p>
        </div>
      )}
    </div>
  );
} 