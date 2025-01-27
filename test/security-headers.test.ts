import { describe, it, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { http } from 'msw';
import fetch from 'node-fetch';

const TEST_URL = 'http://localhost:8888';

describe('Security Headers', () => {
  const server = setupServer(
    http.get('*', async ({ request }) => {
      const response = await fetch(request.url);
      return response;
    })
  );

  it('should have correct Content-Security-Policy headers', async () => {
    const response = await fetch(TEST_URL);
    const cspHeader = response.headers.get('content-security-policy');
    
    expect(cspHeader).toBeDefined();
    expect(cspHeader).toContain("default-src 'self'");
    expect(cspHeader).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com");
    expect(cspHeader).toContain("frame-ancestors 'self' http://localhost:* https://*.netlify.app");
  });

  it('should have correct Permissions-Policy headers', async () => {
    const response = await fetch(TEST_URL);
    const permissionsHeader = response.headers.get('permissions-policy');
    
    expect(permissionsHeader).toBeDefined();
    expect(permissionsHeader).toContain('camera=()');
    expect(permissionsHeader).toContain('microphone=()');
    expect(permissionsHeader).toContain('geolocation=()');
    expect(permissionsHeader).toContain('attribution-reporting=()');
    expect(permissionsHeader).toContain('run-ad-auction=()');
    expect(permissionsHeader).toContain('browsing-topics=()');
  });

  it('should have correct frame-ancestors directive', async () => {
    const response = await fetch(TEST_URL);
    const cspHeader = response.headers.get('content-security-policy');
    
    expect(cspHeader).toContain("frame-ancestors 'self' http://localhost:* https://*.netlify.app");
  });

  it('should have other essential security headers', async () => {
    const response = await fetch(TEST_URL);
    
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('strict-transport-security')).toContain('max-age=63072000');
  });

  it('should have meta CSP tag in HTML', async () => {
    const response = await fetch(TEST_URL);
    const html = await response.text();
    
    expect(html).toContain('<meta http-equiv="Content-Security-Policy"');
    expect(html).toContain("frame-ancestors 'self' http://localhost:* https://*.netlify.app");
    expect(html).toContain("default-src 'self'");
  });
}); 