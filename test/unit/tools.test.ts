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
  },
  jwt: {
    decode: (token: string) => {
      try {
        const [header, payload, signature] = token.split('.');
        return {
          header: JSON.parse(atob(header)),
          payload: JSON.parse(atob(payload)),
          signature
        };
      } catch (e) {
        throw new Error("Invalid JWT token");
      }
    }
  },
  csv: {
    toJson: (csv: string) => {
      const [headers, ...rows] = csv.trim().split('\n').map(row => row.split(','));
      return JSON.stringify(
        rows.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i]]))),
        null,
        2
      );
    },
    fromJson: (json: string) => {
      const data = JSON.parse(json);
      if (!Array.isArray(data) || !data.length) {
        throw new Error("JSON must be an array of objects");
      }
      const headers = Object.keys(data[0]);
      const rows = data.map(obj => headers.map(header => obj[header]));
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
  },
  pdf: {
    generate: async (content: string, options: { format?: string } = {}) => {
      // Mock PDF generation
      return Buffer.from(`PDF Content: ${content}`);
    }
  },
  license: {
    validate: async (key: string) => {
      if (!key) throw new Error("License key is required");
      if (key === "EXPIRED-KEY") return { valid: false, reason: "expired" };
      if (key === "VALID-KEY") return { valid: true, email: "test@example.com" };
      throw new Error("Invalid license key");
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
  
  const invalidDate = "not-a-date";
  expect(tools.timestamp.fromDate(invalidDate)).toBe(NaN);
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

// 2. Pro Features Tests
test('JWT Decoder', () => {
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const decoded = tools.jwt.decode(validToken);
  
  expect(decoded.header).toEqual({
    alg: "HS256",
    typ: "JWT"
  });
  
  expect(decoded.payload).toEqual({
    sub: "1234567890",
    name: "John Doe",
    iat: 1516239022
  });
  
  expect(() => tools.jwt.decode("invalid-token")).toThrow();
  expect(() => tools.jwt.decode("header.payload")).toThrow();
});

test('CSV ↔ JSON Converter', () => {
  const csvData = "name,age\nJohn,25\nJane,30";
  const jsonData = [
    { name: "John", age: "25" },
    { name: "Jane", age: "30" }
  ];
  
  // Test CSV to JSON
  const convertedJson = JSON.parse(tools.csv.toJson(csvData));
  expect(convertedJson).toEqual(jsonData);
  
  // Test JSON to CSV
  const convertedCsv = tools.csv.fromJson(JSON.stringify(jsonData));
  expect(convertedCsv).toBe(csvData);
  
  // Test with missing values
  const csvWithMissing = "name,age,city\nJohn,25,\nJane,30,London";
  expect(() => tools.csv.toJson(csvWithMissing)).not.toThrow();
  
  // Test with special characters
  const csvWithSpecial = 'name,description\nProduct 1,"Contains, comma"';
  expect(() => tools.csv.toJson(csvWithSpecial)).not.toThrow();
});

test('PDF Generator', async () => {
  // Test basic text conversion
  const basicText = "Hello World";
  const basicPdf = await tools.pdf.generate(basicText);
  expect(basicPdf).toBeInstanceOf(Buffer);
  expect(basicPdf.toString()).toContain(basicText);
  
  // Test with formatting
  const formattedText = "**Bold** and *Italic*";
  const formattedPdf = await tools.pdf.generate(formattedText, { format: 'markdown' });
  expect(formattedPdf).toBeInstanceOf(Buffer);
  
  // Test with special characters
  const specialChars = "Special © characters ® and symbols ™";
  const specialPdf = await tools.pdf.generate(specialChars);
  expect(specialPdf).toBeInstanceOf(Buffer);
  expect(specialPdf.toString()).toContain(specialChars);
});

test('License Key Validation', async () => {
  // Test valid license key
  const validResponse = await tools.license.validate("VALID-KEY");
  expect(validResponse.valid).toBe(true);
  expect(validResponse.email).toBe("test@example.com");
  
  // Test expired license
  const expiredResponse = await tools.license.validate("EXPIRED-KEY");
  expect(expiredResponse.valid).toBe(false);
  expect(expiredResponse.reason).toBe("expired");
  
  // Test invalid format
  await expect(tools.license.validate("")).rejects.toThrow("License key is required");
  
  // Test non-existent key
  await expect(tools.license.validate("NON-EXISTENT")).rejects.toThrow("Invalid license key");
});

// Add more test cases for other features... 