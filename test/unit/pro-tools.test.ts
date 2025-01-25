import { describe, test, expect } from 'vitest';
import { tools } from '../../src/lib/tools';

describe('Pro Tools Tests', () => {
  describe('JWT Decoder', () => {
    test('should decode a valid JWT token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const decoded = tools.jwt.decode(token);
      expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(decoded.payload).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022
      });
    });

    test('should handle malformed JWT token', () => {
      expect(() => tools.jwt.decode('invalid.token')).toThrow('Invalid JWT format');
      expect(() => tools.jwt.decode('')).toThrow('Invalid JWT format');
      expect(() => tools.jwt.decode('header.payload')).toThrow('Invalid JWT format');
    });

    test('should handle URL-safe base64 characters', () => {
      const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MTIzNDU2Nzg5MCwibmFtZSI6IkpvaG4gRG9lIn0.QxPCPE1_hD6F8vZ4WQUEexJFnl8iZf_VGJy5p_KXFeE';
      const decoded = tools.jwt.decode(token);
      expect(decoded.header).toEqual({ typ: 'JWT', alg: 'HS256' });
      expect(decoded.payload).toEqual({ id: 1234567890, name: 'John Doe' });
    });
  });

  describe('CSV Converter', () => {
    test('should convert JSON array to CSV', () => {
      const input = JSON.stringify([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ]);
      const expected = 'name,age\nJohn,30\nJane,25';
      expect(tools.csv.format(input)).toBe(expected);
    });

    test('should convert CSV to JSON array', () => {
      const input = 'name,age\nJohn,30\nJane,25';
      const expected = JSON.stringify([
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' }
      ], null, 2);
      expect(tools.csv.format(input)).toBe(expected);
    });

    test('should handle quoted CSV values', () => {
      const input = 'name,description\n"Doe, John","Software Engineer"\n"Smith, Jane","Product Manager"';
      const result = JSON.parse(tools.csv.format(input));
      expect(result).toEqual([
        { name: 'Doe, John', description: 'Software Engineer' },
        { name: 'Smith, Jane', description: 'Product Manager' }
      ]);
    });

    test('should handle missing values', () => {
      const input = JSON.stringify([
        { name: 'John', age: 30, city: 'NY' },
        { name: 'Jane', age: 25 }
      ]);
      const csv = tools.csv.format(input);
      expect(csv.split('\n')[0]).toBe('name,age,city');
      expect(csv.split('\n')[2]).toBe('Jane,25,');
    });

    test('should handle invalid input', () => {
      expect(() => tools.csv.format('')).toThrow('Input must be a non-empty string');
      expect(() => tools.csv.format('invalid,csv\nrow')).toThrow('CSV row has 1 values but expected 2');
    });
  });

  describe('SQL Formatter', () => {
    test('should format a simple SELECT query', () => {
      const input = 'SELECT id, name FROM users WHERE age > 18';
      const formatted = tools.sql.format(input);
      expect(formatted).toContain('SELECT');
      expect(formatted).toContain('FROM');
      expect(formatted).toContain('WHERE');
      expect(formatted.split('\n').length).toBeGreaterThan(1);
    });

    test('should format complex query with JOINs', () => {
      const input = 'SELECT u.id, u.name, o.order_date FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.age > 18 AND o.status = "completed"';
      const formatted = tools.sql.format(input);
      expect(formatted).toContain('LEFT JOIN');
      expect(formatted).toContain('ON');
      expect(formatted.split('\n').length).toBeGreaterThan(3);
    });

    test('should handle invalid SQL', () => {
      expect(() => tools.sql.format('SELEC name FRO users')).toThrow('Invalid SQL query');
    });
  });

  describe('XML Formatter', () => {
    test('should format simple XML', () => {
      const input = '<root><person><n>John</n><age>30</age></person></root>';
      const expected = 
        '<root>\n' +
        '  <person>\n' +
        '    <n>John</n>\n' +
        '    <age>30</age>\n' +
        '  </person>\n' +
        '</root>';
      expect(tools.xml.format(input)).toBe(expected);
    });

    test('should handle self-closing tags', () => {
      const input = '<root><person name="John" age="30"/></root>';
      const expected = 
        '<root>\n' +
        '  <person name="John" age="30"/>\n' +
        '</root>';
      expect(tools.xml.format(input)).toBe(expected);
    });

    test('should handle attributes and mixed content', () => {
      const input = '<root><person id="1"><n>John</n><details type="personal">Some text <b>here</b></details></person></root>';
      const expected = 
        '<root>\n' +
        '  <person id="1">\n' +
        '    <n>John</n>\n' +
        '    <details type="personal">Some text \n' +
        '      <b>here</b>\n' +
        '    </details>\n' +
        '  </person>\n' +
        '</root>';
      expect(tools.xml.format(input)).toBe(expected);
    });

    test('should throw error for invalid XML', () => {
      expect(() => tools.xml.format('<root><unclosed>')).toThrow('Invalid XML document');
    });
  });
}); 