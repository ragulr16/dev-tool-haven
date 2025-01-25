import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProLicense } from '../../src/hooks/use-pro-license';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';

const mockCookies = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('js-cookie', () => ({
  default: mockCookies
}));

describe('Pro License Management', () => {
  const DEV_TEST_KEY = 'DEV-TEST-2024';

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.get.mockImplementation(() => null);
  });

  describe('Development Mode Test Key', () => {
    it('should accept development test key and set pro status', () => {
      const { result } = renderHook(() => useProLicense());

      act(() => {
        result.current.setLicenseKey(DEV_TEST_KEY);
      });

      expect(result.current.licenseKey).toBe(DEV_TEST_KEY);
      expect(result.current.isPro).toBe(true);
      expect(mockCookies.set).toHaveBeenCalledWith('pro_license', DEV_TEST_KEY, { expires: 365 });
    });

    it('should validate development test key successfully', async () => {
      mockCookies.get.mockImplementation(() => DEV_TEST_KEY);
      const { result } = renderHook(() => useProLicense());

      act(() => {
        result.current.setLicenseKey(DEV_TEST_KEY);
      });

      const isValid = await result.current.validateLicense();
      expect(isValid).toBe(true);
      expect(result.current.isPro).toBe(true);
    });

    it('should persist pro status after page reload with dev test key', () => {
      mockCookies.get.mockImplementation(() => DEV_TEST_KEY);
      const { result } = renderHook(() => useProLicense());

      expect(result.current.licenseKey).toBe(DEV_TEST_KEY);
      expect(result.current.isPro).toBe(true);
    });

    it('should clear license and pro status when requested', () => {
      mockCookies.get.mockImplementation(() => DEV_TEST_KEY);
      const { result } = renderHook(() => useProLicense());

      act(() => {
        result.current.clearLicense();
      });

      expect(result.current.licenseKey).toBeNull();
      expect(result.current.isPro).toBe(false);
      expect(mockCookies.remove).toHaveBeenCalledWith('pro_license');
    });
  });

  describe('useProLicense Hook', () => {
    it('should initialize with no license by default', () => {
      mockCookies.get.mockReturnValue(null);
      const { result } = renderHook(() => useProLicense());
      
      act(() => {
        result.current.clearLicense();
      });
      
      expect(result.current.licenseKey).toBeNull();
      expect(result.current.isPro).toBe(false);
    });

    it('should initialize with existing license from cookie', () => {
      mockCookies.get.mockImplementation((key) => {
        if (key === 'pro_license') return 'test-license-key';
        return null;
      });
      
      const { result } = renderHook(() => useProLicense());
      
      act(() => {
        result.current.setLicenseKey('test-license-key');
      });
      
      expect(result.current.licenseKey).toBe('test-license-key');
      expect(result.current.isPro).toBe(true);
    });

    it('should set license key and update pro status', () => {
      const { result } = renderHook(() => useProLicense());
      
      act(() => {
        result.current.setLicenseKey('new-license-key');
      });
      
      expect(mockCookies.set).toHaveBeenCalledWith('pro_license', 'new-license-key', { expires: 365 });
      expect(result.current.licenseKey).toBe('new-license-key');
      expect(result.current.isPro).toBe(true);
    });

    it('should clear license key and update pro status', () => {
      mockCookies.get.mockImplementation((key) => {
        if (key === 'pro_license') return 'test-license-key';
        return null;
      });
      
      const { result } = renderHook(() => useProLicense());
      
      act(() => {
        result.current.setLicenseKey('test-license-key');
      });
      
      act(() => {
        result.current.clearLicense();
      });
      
      expect(mockCookies.remove).toHaveBeenCalledWith('pro_license');
      expect(result.current.licenseKey).toBeNull();
      expect(result.current.isPro).toBe(false);
    });
  });

  describe('License Validation', () => {
    it('should validate a valid license key', async () => {
      server.use(
        http.post('/.netlify/functions/validate-license', () => {
          return HttpResponse.json({
            success: true,
            license: {
              key: 'valid-license',
              type: 'pro',
              email: 'test@example.com',
              created_at: new Date().toISOString()
            }
          });
        })
      );

      const { result } = renderHook(() => useProLicense());
      
      act(() => {
        result.current.setLicenseKey('valid-license');
      });

      const isValid = await result.current.validateLicense();
      expect(isValid).toBe(true);
    });

    it('should handle invalid license key', async () => {
      server.use(
        http.post('/.netlify/functions/validate-license', () => {
          return HttpResponse.json({
            success: false,
            error: 'Invalid license key'
          });
        })
      );

      const { result } = renderHook(() => useProLicense());
      
      act(() => {
        result.current.setLicenseKey('invalid-license');
      });

      const isValid = await result.current.validateLicense();
      expect(isValid).toBe(false);
      
      await waitFor(() => {
        expect(result.current.licenseKey).toBeNull();
        expect(result.current.isPro).toBe(false);
      });
    });

    it('should handle network errors during validation', async () => {
      server.use(
        http.post('/.netlify/functions/validate-license', () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useProLicense());
      
      act(() => {
        result.current.setLicenseKey('test-license');
      });

      const isValid = await result.current.validateLicense();
      expect(isValid).toBe(false);
      
      await waitFor(() => {
        expect(result.current.licenseKey).toBeNull();
        expect(result.current.isPro).toBe(false);
      });
    });

    it('should return false when validating without a license key', async () => {
      const { result } = renderHook(() => useProLicense());
      
      const isValid = await result.current.validateLicense();
      expect(isValid).toBe(false);
    });
  });
}); 