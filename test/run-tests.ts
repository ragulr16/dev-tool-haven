import { test, expect } from 'vitest';

// Test utilities
const tools = {
  jsonFormatter: {
    format: (input: string) => {
      try {
        return JSON.stringify(JSON.parse(input), null, 2);
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    }
  },
  base64: {
    encode: (input: string) => btoa(input),
    decode: (input: string) => atob(input)
  },
  timestamp: {
    toDate: (timestamp: number) => new Date(timestamp * 1000).toISOString(),
    fromDate: (date: string) => Math.floor(new Date(date).getTime() / 1000)
  },
  url: {
    encode: (input: string) => encodeURIComponent(input),
    decode: (input: string) => decodeURIComponent(input)
  },
  regex: {
    test: (pattern: string, input: string) => {
      const regex = new RegExp(pattern);
      return regex.test(input);
    }
  }
};

// 1. Free Tools Tests
test('JSON Formatter', () => {
  const validJson = '{"name":"test","age":25}';
  expect(tools.jsonFormatter.format(validJson)).toContain('"name": "test"');
  
  expect(() => tools.jsonFormatter.format('{name: test}')).toThrow();
  
  const nestedJson = '{"user":{"name":"test","details":{"age":25}}}';
  const formatted = tools.jsonFormatter.format(nestedJson);
  expect(formatted).toContain('"user": {');
  expect(formatted).toContain('  "details": {');
});

test('Base64 Encoder/Decoder', () => {
  const text = "Hello World";
  const encoded = tools.base64.encode(text);
  expect(encoded).toBe("SGVsbG8gV29ybGQ=");
  expect(tools.base64.decode(encoded)).toBe(text);
  
  const specialChars = "Hello @#$%^";
  const specialEncoded = tools.base64.encode(specialChars);
  expect(tools.base64.decode(specialEncoded)).toBe(specialChars);
});

test('Timestamp Converter', () => {
  const timestamp = 1677649200;
  const date = "2024-03-01T00:00:00.000Z";
  
  expect(tools.timestamp.toDate(timestamp)).toContain("2023");
  expect(tools.timestamp.fromDate(date)).toBeGreaterThan(0);
  
  expect(() => tools.timestamp.fromDate("invalid-date")).toThrow();
});

test('URL Encoder/Decoder', () => {
  const url = "https://example.com/path with spaces";
  const encoded = tools.url.encode(url);
  expect(encoded).toContain("%20");
  expect(tools.url.decode(encoded)).toBe(url);
  
  const specialUrl = "https://example.com/?q=test&name=John Doe";
  const specialEncoded = tools.url.encode(specialUrl);
  expect(tools.url.decode(specialEncoded)).toBe(specialUrl);
});

test('Regex Tester', () => {
  const emailPattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
  expect(tools.regex.test(emailPattern, "test@example.com")).toBe(true);
  expect(tools.regex.test(emailPattern, "invalid-email")).toBe(false);
  
  const phonePattern = "^\\d{3}-\\d{3}-\\d{4}$";
  expect(tools.regex.test(phonePattern, "123-456-7890")).toBe(true);
  expect(tools.regex.test(phonePattern, "123-456-789")).toBe(false);
});

// Add more test cases for other features... 