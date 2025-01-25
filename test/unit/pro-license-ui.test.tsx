import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProLicenseManager } from '../../src/components/ProLicenseManager';
import ToolCard from '../../src/components/ToolCard';
import { useProLicense } from '../../src/hooks/use-pro-license';

// Mock the Pro license hook
vi.mock('../../src/hooks/use-pro-license', () => ({
  useProLicense: vi.fn(),
}));

// Mock the toast hook
vi.mock('../../src/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Pro License UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('ProLicenseManager', () => {
    it('should show inactive state when not pro', () => {
      vi.mocked(useProLicense).mockReturnValue({
        isPro: false,
        licenseKey: null,
        setLicenseKey: vi.fn(),
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
      });

      const { getByText } = render(<ProLicenseManager />);
      expect(getByText('Inactive')).toBeInTheDocument();
    });

    it('should show active state with license key when pro', () => {
      vi.mocked(useProLicense).mockReturnValue({
        isPro: true,
        licenseKey: 'test-license-key',
        setLicenseKey: vi.fn(),
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
      });

      const { getByText } = render(<ProLicenseManager />);
      expect(getByText('Active')).toBeInTheDocument();
    });

    it('should handle license validation', async () => {
      const setLicenseKey = vi.fn();
      const validateLicense = vi.fn().mockResolvedValue(true);
      
      vi.mocked(useProLicense).mockReturnValue({
        isPro: false,
        licenseKey: null,
        setLicenseKey,
        validateLicense,
        clearLicense: vi.fn(),
      });

      const { getByPlaceholderText, getByText } = render(<ProLicenseManager />);
      
      const input = getByPlaceholderText('Enter license key');
      const validateButton = getByText('Validate');
      
      fireEvent.change(input, { target: { value: 'new-license' } });
      fireEvent.click(validateButton);
      
      await waitFor(() => {
        expect(validateLicense).toHaveBeenCalled();
        expect(setLicenseKey).toHaveBeenCalledWith('new-license');
      });
    });

    it('should show pro features with dev license', async () => {
      const setLicenseKey = vi.fn();
      
      vi.mocked(useProLicense).mockReturnValue({
        isPro: true,
        licenseKey: 'DEV-TEST-2024',
        setLicenseKey,
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
      });

      const { getByText } = render(<ProLicenseManager />);
      expect(getByText('Active')).toBeInTheDocument();
    });
  });

  describe('ToolCard Pro Features', () => {
    it('should show pro overlay when not pro', () => {
      vi.mocked(useProLicense).mockReturnValue({
        isPro: false,
        licenseKey: null,
        setLicenseKey: vi.fn(),
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
      });

      render(
        <ToolCard
          title="JWT Decoder"
          description="Decode JWT tokens"
          isPro={true}
          type="jwt"
          onFormat={() => 'decoded'}
        />
      );
      
      expect(screen.getByText('Pro Feature')).toBeInTheDocument();
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    it('should allow usage when pro', () => {
      vi.mocked(useProLicense).mockReturnValue({
        isPro: true,
        licenseKey: 'test-key',
        setLicenseKey: vi.fn(),
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
      });

      render(
        <ToolCard
          title="JWT Decoder"
          description="Decode JWT tokens"
          isPro={true}
          type="jwt"
          onFormat={() => 'decoded'}
        />
      );
      
      const input = screen.getByPlaceholderText('Input');
      const formatButton = screen.getByText('Format');
      
      fireEvent.change(input, { target: { value: 'test-input' } });
      
      expect(input).not.toBeDisabled();
      expect(formatButton).not.toBeDisabled();
    });

    it('should handle formatting in pro mode', async () => {
      const mockFormat = vi.fn().mockResolvedValue('decoded result');
      
      vi.mocked(useProLicense).mockReturnValue({
        isPro: true,
        licenseKey: 'test-key',
        setLicenseKey: vi.fn(),
        validateLicense: vi.fn(),
        clearLicense: vi.fn(),
      });

      render(
        <ToolCard
          title="JWT Decoder"
          description="Decode JWT tokens"
          isPro={true}
          type="jwt"
          onFormat={mockFormat}
        />
      );
      
      const input = screen.getByPlaceholderText('Input');
      const formatButton = screen.getByText('Format');
      
      fireEvent.change(input, { target: { value: 'test-input' } });
      fireEvent.click(formatButton);
      
      await waitFor(() => {
        expect(mockFormat).toHaveBeenCalledWith('test-input');
        expect(screen.getByPlaceholderText('Output')).toHaveValue('decoded result');
      });
    });
  });
}); 