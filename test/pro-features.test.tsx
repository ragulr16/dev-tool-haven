import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProLicenseManager } from '../src/components/ProLicenseManager';
import ToolCard from '../src/components/ToolCard';
import { useProLicense } from '../src/hooks/use-pro-license';
import { ProLicenseProvider } from '../src/contexts/ProLicenseContext';
import { server } from './setup';
import { http, HttpResponse } from 'msw';

// Mock the Pro license hook
vi.mock('../src/hooks/use-pro-license');

describe('Pro Features UI Tests', () => {
  const DEV_TEST_KEY = 'DEV-TEST-2024';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('License Activation UI', () => {
    it('should show pro badge when activated', () => {
      vi.mocked(useProLicense).mockReturnValue({
        isPro: true,
        hasProLicense: true,
        licenseKey: DEV_TEST_KEY,
        setLicenseKey: vi.fn(),
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
        isLoading: false,
        error: null
      });

      render(<ProLicenseManager />);
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText(DEV_TEST_KEY)).toBeInTheDocument();
    });

    it('should handle dev key activation', async () => {
      const setLicenseKey = vi.fn();
      vi.mocked(useProLicense).mockReturnValue({
        isPro: false,
        hasProLicense: false,
        licenseKey: null,
        setLicenseKey,
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
        isLoading: false,
        error: null
      });

      render(<ProLicenseManager />);
      
      const input = screen.getByPlaceholderText('Enter license key');
      const validateButton = screen.getByText('Validate');
      
      fireEvent.change(input, { target: { value: DEV_TEST_KEY } });
      fireEvent.click(validateButton);
      
      await waitFor(() => {
        expect(setLicenseKey).toHaveBeenCalledWith(DEV_TEST_KEY);
      });
    });
  });

  describe('Pro Tools UI', () => {
    it('should block pro tools when not activated', () => {
      vi.mocked(useProLicense).mockReturnValue({
        isPro: false,
        hasProLicense: false,
        licenseKey: null,
        setLicenseKey: vi.fn(),
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
        isLoading: false,
        error: null
      });

      render(
        <ProLicenseProvider>
          <ToolCard
            title="JWT Decoder"
            description="Decode JWT tokens"
            isPro={true}
            onFormat={vi.fn()}
          />
        </ProLicenseProvider>
      );
      
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Input');
      expect(input).toBeDisabled();
    });

    it('should show pro tools when activated', async () => {
      const mockFormat = vi.fn();
      vi.mocked(useProLicense).mockReturnValue({
        isPro: true,
        hasProLicense: true,
        licenseKey: 'test-key',
        setLicenseKey: vi.fn(),
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
        isLoading: false,
        error: null
      });

      render(
        <ProLicenseProvider>
          <ToolCard
            title="JWT Decoder"
            description="Decode JWT tokens"
            isPro={true}
            onFormat={mockFormat}
          />
        </ProLicenseProvider>
      );

      const input = screen.getByPlaceholderText('Input');
      expect(input).not.toBeDisabled();
      
      fireEvent.change(input, { target: { value: 'test-input' } });
      fireEvent.click(screen.getByText('Format'));

      expect(mockFormat).toHaveBeenCalledWith('test-input');
    });
  });

  describe('Rate Limiting UI', () => {
    it('should show pro rate limits in headers', async () => {
      server.use(
        http.post('/.netlify/functions/format', () => {
          return new HttpResponse(
            JSON.stringify({ result: 'decoded' }),
            {
              headers: {
                'x-ratelimit-limit': '60',
                'x-ratelimit-remaining': '59',
                'content-type': 'application/json'
              }
            }
          );
        })
      );

      vi.mocked(useProLicense).mockReturnValue({
        isPro: true,
        hasProLicense: true,
        licenseKey: 'test-key',
        setLicenseKey: vi.fn(),
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
        isLoading: false,
        error: null
      });

      render(
        <ProLicenseProvider>
          <ToolCard
            title="JWT Decoder"
            description="Decode JWT tokens"
            isPro={true}
            onFormat={async (input) => {
              const response = await fetch('/.netlify/functions/format', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input })
              });
              const data = await response.json();
              const remaining = response.headers.get('x-ratelimit-remaining');
              const limit = response.headers.get('x-ratelimit-limit');
              return { ...data, rateLimits: `${remaining}/${limit} requests remaining` };
            }}
          />
        </ProLicenseProvider>
      );

      const input = screen.getByPlaceholderText('Input');
      fireEvent.change(input, { target: { value: 'test-input' } });
      fireEvent.click(screen.getByText('Format'));

      await waitFor(() => {
        const rateLimitText = screen.getByText(/\d+\/\d+ requests remaining/);
        expect(rateLimitText).toBeInTheDocument();
        expect(rateLimitText.textContent).toBe('59/60 requests remaining');
      });
    });
  });
}); 