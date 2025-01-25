import { describe, it, expect } from 'vitest';
import { tools } from '../../src/lib/tools';

describe('XML Formatter', () => {
  it('should format a simple XML string correctly', () => {
    const input = '<root><child>value</child></root>';
    const expected = `<root>
  <child>value</child>
</root>`;
    expect(tools.xml.format(input)).toBe(expected);
  });

  it('should format a complex XML string with attributes', () => {
    const input = '<root><child id="1" type="test"><subchild>value</subchild></child></root>';
    const expected = `<root>
  <child id="1" type="test">
    <subchild>value</subchild>
  </child>
</root>`;
    expect(tools.xml.format(input)).toBe(expected);
  });

  it('should handle XML with multiple levels of nesting', () => {
    const input = '<root><level1><level2><level3>value</level3></level2></level1></root>';
    const expected = `<root>
  <level1>
    <level2>
      <level3>value</level3>
    </level2>
  </level1>
</root>`;
    expect(tools.xml.format(input)).toBe(expected);
  });

  it('should throw error for invalid XML', () => {
    expect(() => tools.xml.format('<invalid>')).toThrow('Invalid XML document');
  });

  it('should throw error for empty input', () => {
    expect(() => tools.xml.format('')).toThrow('Invalid XML document');
  });

  it('should throw error for non-string input', () => {
    // @ts-expect-error Testing invalid input
    expect(() => tools.xml.format(null)).toThrow('Invalid XML document');
    // @ts-expect-error Testing invalid input
    expect(() => tools.xml.format(undefined)).toThrow('Invalid XML document');
    // @ts-expect-error Testing invalid input
    expect(() => tools.xml.format(123)).toThrow('Invalid XML document');
  });
}); 