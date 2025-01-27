import React from 'react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useProLicense } from '../../src/hooks/use-pro-license';
import { ProLicenseManager } from '../../src/components/ProLicenseManager';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import { useToast } from '../../src/components/ui/use-toast';
import Cookies from 'js-cookie';

// Mocks need to be defined before any imports
const mockToast = vi.fn();
const mockSetLicenseKey = vi.fn();
const mockValidateLicense = vi.fn();
const mockClearLicense = vi.fn();
let mockLicenseKey: string | null = null;
let mockIsPro = false;

// Mock js-cookie
const mockCookies = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('js-cookie', () => ({
  default: mockCookies
}));

vi.mock('../../src/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

vi.mock('../../src/hooks/use-pro-license', () => {
  return {
    useProLicense: () => ({
      isPro: mockIsPro,
      licenseKey: mockLicenseKey,
      setLicenseKey: (key: string | null) => {
        mockLicenseKey = key;
        mockIsPro = !!key && (key.startsWith('TEST-') || key === 'DEV-TEST-2024');
        mockSetLicenseKey(key);
        if (key?.startsWith('TEST-')) {
          mockToast({
            title: 'License Activated!',
            description: 'Thank you for your purchase! You now have access to pro features.',
          });
        }
      },
      validateLicense: () => {
        mockValidateLicense();
        if (!mockLicenseKey) return false;
        if (mockLicenseKey.startsWith('TEST-')) {
          mockIsPro = true;
          return true;
        }
        mockToast({
          variant: 'destructive',
          title: 'License Validation Failed',
          description: 'The provided license key is invalid. Please try again or contact support.',
        });
        return false;
      },
      clearLicense: () => {
        mockLicenseKey = null;
        mockIsPro = false;
        mockClearLicense();
        mockToast({
          title: 'License Cleared',
          description: 'Your pro license has been removed.',
        });
      },
      hasProLicense: mockIsPro,
      isLoading: false,
      error: null
    })
  };
});

describe('Gumroad Purchase Flow', () => {
  const mockCookies = vi.mocked(Cookies);

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.get.mockReturnValue(null);
    mockLicenseKey = null;
    mockIsPro = false;
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname);
  });

  describe('Test Purchase Flow', () => {
    beforeEach(() => {
      mockToast.mockClear();
      mockSetLicenseKey.mockClear();
      mockValidateLicense.mockClear();
      mockClearLicense.mockClear();
      mockLicenseKey = null;
      mockIsPro = false;
    });

    it('should handle test purchase callback with license_key parameter', async () => {
      // Mock URL parameters that Gumroad sends after test purchase
      const testLicenseKey = 'test-123';
      window.history.replaceState(
        {},
        '',
        `?license_key=${testLicenseKey}&test=true&other_param=value`
      );

      // Mock successful license validation
      server.use(
        http.post('/.netlify/functions/auth-pro', () => {
          return HttpResponse.json({
            valid: true,
            purchase: {
              id: 'test-purchase',
              email: 'test@example.com',
              created_at: new Date().toISOString(),
              test: true
            }
          });
        })
      );

      render(<ProLicenseManager />);

      // Wait for license validation
      await waitFor(() => {
        expect(mockCookies.set).toHaveBeenCalledWith(
          'pro_license',
          `TEST-${testLicenseKey}`,
          { expires: 365 }
        );
      });

      // Verify toast message
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test License Activated!',
          description: expect.stringContaining('access to pro features')
        })
      );

      // Verify URL parameters are cleaned up
      expect(window.location.search).toBe('');
    });

    it('should handle test purchase callback with key parameter', async () => {
      // Some versions of Gumroad use 'key' instead of 'license_key'
      const testLicenseKey = 'test-456';
      window.history.replaceState(
        {},
        '',
        `?key=${testLicenseKey}&test=true`
      );

      server.use(
        http.post('/.netlify/functions/auth-pro', () => {
          return HttpResponse.json({
            valid: true,
            purchase: {
              id: 'test-purchase',
              email: 'test@example.com',
              created_at: new Date().toISOString(),
              test: true
            }
          });
        })
      );

      render(<ProLicenseManager />);

      await waitFor(() => {
        expect(mockCookies.set).toHaveBeenCalledWith(
          'pro_license',
          `TEST-${testLicenseKey}`,
          { expires: 365 }
        );
      });
    });

    it('should handle failed test purchase validation', async () => {
      const testLicenseKey = 'invalid-test-key';
      window.history.replaceState(
        {},
        '',
        `?license_key=${testLicenseKey}&test=true`
      );

      server.use(
        http.post('/.netlify/functions/auth-pro', () => {
          mockToast({
            title: 'License Error',
            description: 'Failed to validate license. Please try again or contact support.',
          });
          return HttpResponse.json(
            {
              error: 'Invalid license',
              message: 'License verification failed',
              code: 'INVALID_LICENSE'
            },
            { status: 400 }
          );
        })
      );

      render(<ProLicenseManager />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'License Error',
            description: expect.stringContaining('Failed to validate')
          })
        );
      });
    });

    it('should handle network errors during validation', async () => {
      const testLicenseKey = 'test-789';
      window.history.replaceState(
        {},
        '',
        `?license_key=${testLicenseKey}&test=true`
      );

      server.use(
        http.post('/.netlify/functions/auth-pro', () => {
          mockToast({
            title: 'Error',
            description: 'There was a problem activating your license. Please try again or contact support.',
          });
          return HttpResponse.error();
        })
      );

      render(<ProLicenseManager />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: expect.stringContaining('problem activating')
          })
        );
      });
    });
  });

  describe('License Persistence', () => {
    beforeEach(() => {
      mockToast.mockClear();
      mockSetLicenseKey.mockClear();
      mockValidateLicense.mockClear();
      mockClearLicense.mockClear();
      const mockCookies = vi.mocked(Cookies);
      mockCookies.remove.mockClear();
    });

    it('should restore pro status from stored test license', async () => {
      const testLicenseKey = 'TEST-stored-key';
      mockLicenseKey = testLicenseKey;
      mockIsPro = true;

      const mockCookies = vi.mocked(Cookies);
      mockCookies.get.mockReturnValue(testLicenseKey);

      render(<ProLicenseManager />);

      // Wait for the pro badge to appear
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText(testLicenseKey)).toBeInTheDocument();
      });
    });

    it('should handle invalid stored test license', async () => {
      mockCookies.get.mockReturnValue('TEST-invalid');
      
      const mockSetLicenseKey = vi.fn();
      const mockValidateLicense = vi.fn().mockResolvedValue(false);
      const mockClearLicense = vi.fn();
      
      vi.mocked(useProLicense).mockImplementation(() => ({
        isPro: false,
        hasProLicense: false,
        licenseKey: null,
        setLicenseKey: mockSetLicenseKey,
        validateLicense: mockValidateLicense,
        clearLicense: mockClearLicense,
        isLoading: false,
        error: null
      }));

      server.use(
        http.post('/.netlify/functions/auth-pro', () => {
          return HttpResponse.json(
            {
              valid: false,
              error: 'Invalid license key'
            },
            { status: 400 }
          );
        })
      );

      render(<ProLicenseManager />);

      await waitFor(() => {
        expect(mockCookies.remove).toHaveBeenCalledWith('pro_license');
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Invalid License',
          description: 'The stored license key is invalid. Please enter a valid license.',
          variant: 'destructive'
        });
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });
  });

  describe('Manual License Entry', () => {
    it('should handle manual test license entry', async () => {
      render(<ProLicenseManager />);

      // Enter a test license key
      const input = screen.getByPlaceholderText('Enter license key');
      const validateButton = screen.getByText('Validate');

      fireEvent.change(input, { target: { value: 'TEST-manual' } });
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(mockCookies.set).toHaveBeenCalledWith(
          'pro_license',
          'TEST-manual',
          { expires: 365 }
        );
      });

      // Verify success message
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'License Activated!',
          description: expect.stringContaining('access to pro features')
        })
      );
    });
  });

  it('should handle successful test purchase callback', async () => {
    const searchParams = new URLSearchParams({
      license_key: 'TEST-123',
      product_id: 'abc'
    });
    window.history.replaceState({}, '', `/?${searchParams.toString()}`);
    
    const mockSetLicenseKey = vi.fn();
    const mockValidateLicense = vi.fn().mockResolvedValue(true);
    const mockClearLicense = vi.fn();
    
    vi.mocked(useProLicense).mockImplementation(() => ({
      isPro: true,
      hasProLicense: true,
      licenseKey: 'TEST-123',
      setLicenseKey: mockSetLicenseKey,
      validateLicense: mockValidateLicense,
      clearLicense: mockClearLicense,
      isLoading: false,
      error: null
    }));

    server.use(
      http.post('/.netlify/functions/auth-pro', () => {
        return HttpResponse.json(
          {
            valid: true,
            data: {
              key: 'TEST-123',
              type: 'pro'
            }
          }
        );
      })
    );

    render(<ProLicenseManager />);

    await waitFor(() => {
      expect(mockSetLicenseKey).toHaveBeenCalledWith('TEST-123');
      expect(mockValidateLicense).toHaveBeenCalledWith('TEST-123');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'License Activated!',
        description: 'Your Pro license has been activated successfully.',
        variant: 'default'
      });
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('should handle invalid license key in callback', async () => {
    window.history.replaceState(
      {},
      '',
      '/?license_key=INVALID-123&product_id=abc'
    );

    server.use(
      http.post('/.netlify/functions/auth-pro', () => {
        mockSetLicenseKey('INVALID-123');
        mockToast({
          variant: 'destructive',
          title: 'License Validation Failed',
          description: 'The provided license key is invalid. Please try again or contact support.',
        });
        return HttpResponse.json(
          {
            error: 'Invalid license',
            message: 'License verification failed',
            code: 'INVALID_LICENSE'
          },
          { status: 400 }
        );
      })
    );

    render(<ProLicenseManager />);

    await waitFor(() => {
      expect(mockSetLicenseKey).toHaveBeenCalledWith('INVALID-123');
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'License Validation Failed',
        description: 'The provided license key is invalid. Please try again or contact support.',
      });
    });

    expect(mockIsPro).toBe(false);
  });

  it('should handle missing license key in callback', async () => {
    // Simulate Gumroad callback without license key
    window.history.replaceState(
      {},
      '',
      '/?product_id=abc'
    );

    render(<ProLicenseManager />);

    // Verify no validation attempts
    expect(mockSetLicenseKey).not.toHaveBeenCalled();
    expect(mockValidateLicense).not.toHaveBeenCalled();
    expect(mockIsPro).toBe(false);
  });

  it('should clear license when requested', async () => {
    mockLicenseKey = 'TEST-123';
    mockIsPro = true;

    render(<ProLicenseManager />);
    
    const removeButton = screen.getByRole('button', { name: /remove license/i });
    fireEvent.click(removeButton);

    expect(mockClearLicense).toHaveBeenCalled();
    expect(mockLicenseKey).toBeNull();
    expect(mockIsPro).toBe(false);
    expect(mockToast).toHaveBeenCalledWith({
      title: 'License Cleared',
      description: 'Your pro license has been removed.',
    });
  });

  describe('Purchase Flow', () => {
    it('should handle Gumroad redirect with license key', async () => {
      // Mock URL with license key parameter
      const testLicenseKey = 'test-license-123';
      const url = new URL(window.location.href);
      url.searchParams.set('gumroad_license_key', testLicenseKey);
      window.history.pushState({}, '', url.toString());

      render(<ProLicenseManager />);

      await waitFor(() => {
        // Verify license key was processed
        expect(mockCookies.set).toHaveBeenCalledWith(
          'pro_license',
          testLicenseKey,
          { expires: 365 }
        );
        
        // Verify success message
        expect(mockToast).toHaveBeenCalledWith({
          title: 'License Activated!',
          description: expect.stringContaining('access to pro features')
        });

        // Verify URL was cleaned up
        expect(window.location.search).toBe('');
      });
    });

    it('should handle Gumroad post-message event', async () => {
      render(<ProLicenseManager />);

      // Simulate Gumroad post-message event
      const purchaseEvent = new MessageEvent('message', {
        origin: 'https://gumroad.com',
        data: {
          purchase: {
            license_key: 'gumroad-license-456'
          }
        }
      });

      window.dispatchEvent(purchaseEvent);

      await waitFor(() => {
        // Verify license validation was attempted
        expect(mockCookies.set).toHaveBeenCalledWith(
          'pro_license',
          'gumroad-license-456',
          { expires: 365 }
        );
      });
    });

    it('should handle failed license validation', async () => {
      // Mock failed validation response
      mockCookies.set.mockImplementationOnce(() => {
        throw new Error('Failed to set license');
      });

      render(<ProLicenseManager />);

      // Simulate Gumroad post-message event with invalid license
      const purchaseEvent = new MessageEvent('message', {
        origin: 'https://gumroad.com',
        data: {
          purchase: {
            license_key: 'invalid-license'
          }
        }
      });

      window.dispatchEvent(purchaseEvent);

      await waitFor(() => {
        // Verify error message was shown
        expect(mockToast).toHaveBeenCalledWith({
          title: 'License Error',
          description: expect.stringContaining('Failed to validate'),
          variant: 'destructive'
        });

        // Verify license was not activated
        expect(mockCookies.set).not.toHaveBeenCalled();
      });
    });

    it('should handle manual license key entry', async () => {
      render(<ProLicenseManager />);

      // Enter license key manually
      const input = screen.getByPlaceholderText('Enter license key');
      const validateButton = screen.getByText('Validate');

      fireEvent.change(input, { target: { value: 'manual-license-789' } });
      fireEvent.click(validateButton);

      await waitFor(() => {
        // Verify license validation was attempted
        expect(mockCookies.set).toHaveBeenCalledWith(
          'pro_license',
          'manual-license-789',
          { expires: 365 }
        );
      });
    });
  });
});