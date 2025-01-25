import { Buffer } from 'buffer';
import { format as sqlFormat } from 'sql-formatter';

interface JWTHeader {
  alg: string;
  typ: string;
}

interface JWTPayload {
  [key: string]: any;
}

interface JWTDecoded {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
}

export const tools = {
  jwt: {
    decode: (token: string): JWTDecoded => {
      try {
        if (!token || typeof token !== 'string') {
          throw new Error("Invalid JWT format");
        }

        // Replace URL-safe characters before splitting
        const normalizedToken = token.replace(/-/g, '+').replace(/_/g, '/');
        const parts = normalizedToken.split('.');
        if (parts.length !== 3) {
          throw new Error("Invalid JWT format");
        }

        const [headerB64, payloadB64, signature] = parts;

        // Add padding if needed
        const addPadding = (str: string): string => {
          const padding = str.length % 4;
          if (padding) {
            return str + '='.repeat(4 - padding);
          }
          return str;
        };

        try {
          // Decode header with proper padding
          const header = JSON.parse(
            Buffer.from(addPadding(headerB64), 'base64').toString()
          ) as JWTHeader;

          // Decode payload with proper padding
          const payload = JSON.parse(
            Buffer.from(addPadding(payloadB64), 'base64').toString()
          ) as JWTPayload;

          return {
            header,
            payload,
            signature: signature.replace(/[+]/g, '-').replace(/[/]/g, '_')
          };
        } catch (e) {
          throw new Error("Invalid JWT token: Malformed base64 or JSON");
        }
      } catch (e) {
        if (e.message === "Invalid JWT format") {
          throw e;
        }
        throw new Error("Invalid JWT token: " + e.message);
      }
    }
  },
  sql: {
    format: (input: string): string => {
      try {
        if (!input || typeof input !== 'string') {
          throw new Error('Invalid SQL query');
        }

        // Basic SQL validation
        const normalizedInput = input.trim().toUpperCase();
        if (!normalizedInput.match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|MERGE)/)) {
          throw new Error('Invalid SQL query');
        }

        return sqlFormat(input, {
          language: 'sql',
          tabWidth: 2,
          keywordCase: 'upper',
          linesBetweenQueries: 2
        });
      } catch (error) {
        console.error('[SQL Formatter] Error:', error);
        throw new Error('Invalid SQL query');
      }
    }
  },
  xml: {
    format: (input: string): string => {
      try {
        if (!input || typeof input !== 'string') {
          throw new Error('Invalid XML document');
        }

        if (!input.includes('</') && !input.endsWith('/>')) {
          throw new Error('Invalid XML document');
        }

        const INDENT = '  '; // 2 spaces
        let formatted = '';
        let indent = '';
        let lastChar = '';
        let inTag = false;
        let inContent = false;

        for (let i = 0; i < input.length; i++) {
          const char = input[i];

          if (char === '<' && input[i + 1] !== '/') {
            if (!inContent) formatted += '\n' + indent;
            indent += INDENT;
            inTag = true;
            inContent = false;
          } else if (char === '<' && input[i + 1] === '/') {
            indent = indent.slice(0, -2);
            if (!inContent) formatted += '\n' + indent;
            inTag = true;
            inContent = false;
          } else if (char === '>' && lastChar === '/') {
            indent = indent.slice(0, -2);
            inTag = false;
          } else if (char === '>') {
            inTag = false;
            inContent = true;
          } else if (!inTag && !(/\s/).test(char)) {
            if (lastChar === '>') formatted += '\n' + indent;
            inContent = true;
          }

          formatted += char;
          lastChar = char;
        }

        return formatted.trim();
      } catch (error) {
        console.error('[XML Formatter] Error:', error);
        throw new Error('Invalid XML document');
      }
    }
  },
  csv: {
    format: (input: string): string => {
      try {
        if (!input || typeof input !== 'string') {
          throw new Error("Input must be a non-empty string");
        }

        // Check if input is JSON or CSV
        const trimmedInput = input.trim();
        if (trimmedInput.startsWith('{') || trimmedInput.startsWith('[')) {
          // Convert JSON to CSV
          let json: Record<string, unknown>[];
          try {
            const parsed = JSON.parse(trimmedInput);
            json = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            throw new Error("Invalid JSON format");
          }

          if (json.length === 0) {
            return '';
          }

          // Get all possible headers from all objects
          const headers: string[] = Array.from(new Set<string>(
            json.reduce<string[]>((acc, obj) => [...acc, ...Object.keys(obj)], [])
          ));

          // Create CSV rows with proper escaping
          const escapeCsvValue = (value: unknown): string => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          };

          const rows = json.map(obj => 
            headers.map(header => escapeCsvValue(obj[header]))
          );

          return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        } else {
          // Convert CSV to JSON
          const lines = trimmedInput.split('\n').map(line => line.trim()).filter(Boolean);
          if (lines.length < 1) {
            throw new Error("Invalid CSV format: Empty input");
          }
          
          const headers = lines[0].split(',').map(header => header.trim());
          const rows = lines.slice(1);
          
          // Parse CSV values with proper handling of quoted values
          const parseCsvRow = (row: string): string[] => {
            const values: string[] = [];
            let currentValue = '';
            let insideQuotes = false;
            
            for (let i = 0; i < row.length; i++) {
              const char = row[i];
              if (char === '"') {
                if (insideQuotes && row[i + 1] === '"') {
                  currentValue += '"';
                  i++;
                } else {
                  insideQuotes = !insideQuotes;
                }
              } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            values.push(currentValue.trim());
            return values;
          };

          const result = rows.map(row => {
            const values = parseCsvRow(row);
            if (values.length !== headers.length) {
              throw new Error(`CSV row has ${values.length} values but expected ${headers.length}`);
            }
            return Object.fromEntries(headers.map((header, i) => [header, values[i]]));
          });
          
          return JSON.stringify(result, null, 2);
        }
      } catch (e) {
        throw new Error(`CSV conversion error: ${e.message}`);
      }
    }
  }
};