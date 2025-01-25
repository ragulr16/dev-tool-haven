import React, { useState } from 'react';
import ToolCard from '@/components/ToolCard';
import SearchTools from '@/components/SearchTools';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tools as toolUtils } from '@/lib/tools';

type ToolType = 'json' | 'xml' | 'jwt' | 'sql' | 'base64' | 'url' | 'timestamp' | 'regex' | 'csv';

interface ToolCardProps {
  title: string;
  description: string;
  isPro?: boolean;
  onFormat?: (input: string) => string;
  type?: ToolType;
}

const tools = [
  {
    id: 1,
    title: "JSON Formatter",
    description: "Format and validate JSON data with syntax highlighting",
    isPro: false,
    type: "json" as ToolType,
    format: (input: string) => {
      try {
        return JSON.stringify(JSON.parse(input), null, 2);
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    }
  },
  {
    id: 2,
    title: "Base64 Encoder",
    description: "Encode and decode Base64 strings",
    isPro: false,
    type: "base64" as ToolType,
    format: (input: string) => {
      try {
        return btoa(input);
      } catch (e) {
        throw new Error("Invalid input");
      }
    }
  },
  {
    id: 3,
    title: "URL Encoder",
    description: "Encode and decode URLs",
    isPro: false,
    type: "url" as ToolType,
    format: (input: string) => {
      try {
        return encodeURIComponent(input);
      } catch (e) {
        throw new Error("Invalid URL");
      }
    }
  },
  {
    id: 4,
    title: "Timestamp Converter",
    description: "Convert between Unix timestamps and human-readable dates",
    isPro: false,
    type: "timestamp" as ToolType,
    format: (input: string) => {
      try {
        // Handle both timestamp to date and date to timestamp
        const num = parseInt(input);
        if (!isNaN(num)) {
          // Convert timestamp to date
          return new Date(num * 1000).toISOString();
        } else {
          // Convert date to timestamp
          return Math.floor(new Date(input).getTime() / 1000).toString();
        }
      } catch (e) {
        throw new Error("Invalid timestamp or date format");
      }
    }
  },
  {
    id: 5,
    title: "Regex Tester",
    description: "Test and validate regular expressions",
    isPro: false,
    type: "regex" as ToolType,
    format: (input: string) => {
      try {
        const [pattern, testString] = input.split('\n');
        if (!pattern || !testString) {
          throw new Error("Please provide both pattern and test string");
        }
        const regex = new RegExp(pattern);
        const matches = testString.match(regex);
        return matches ? JSON.stringify(matches, null, 2) : "No matches found";
      } catch (e) {
        throw new Error("Invalid regex pattern");
      }
    }
  },
  {
    id: 6,
    title: "JWT Decoder",
    description: "Decode and verify JWT tokens",
    isPro: true,
    type: "jwt" as ToolType,
    format: (input: string) => {
      try {
        const decoded = toolUtils.jwt.decode(input);
        return JSON.stringify({
          header: decoded.header,
          payload: decoded.payload,
          signature: decoded.signature
        }, null, 2);
      } catch (e) {
        throw new Error("Invalid JWT token");
      }
    }
  },
  {
    id: 7,
    title: "CSV ⇄ JSON Converter",
    description: "Convert between CSV and JSON formats",
    isPro: true,
    type: "csv" as ToolType,
    format: (input: string) => {
      try {
        // Check if input is CSV or JSON
        if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
          // Convert JSON to CSV
          const json = JSON.parse(input);
          if (!Array.isArray(json)) {
            throw new Error("JSON must be an array of objects");
          }
          const headers = Object.keys(json[0]);
          const rows = json.map(obj => headers.map(header => obj[header]));
          return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        } else {
          // Convert CSV to JSON
          const [headers, ...rows] = input.trim().split('\n').map(row => row.split(','));
          return JSON.stringify(
            rows.map(row => 
              Object.fromEntries(headers.map((h, i) => [h, row[i]]))
            ),
            null,
            2
          );
        }
      } catch (e) {
        throw new Error("Invalid CSV or JSON format");
      }
    }
  },
  {
    id: 8,
    title: "SQL Formatter",
    description: "Format SQL queries with proper indentation",
    isPro: true,
    type: "sql" as ToolType,
    format: (input: string) => {
      try {
        return toolUtils.sql.format(input);
      } catch (e) {
        throw new Error("Invalid SQL query");
      }
    }
  },
  {
    id: 9,
    title: "XML Formatter",
    description: "Format XML documents with proper indentation",
    isPro: true,
    type: "xml" as ToolType,
    format: (input: string) => {
      try {
        return toolUtils.xml.format(input);
      } catch (e) {
        throw new Error("Invalid XML document");
      }
    }
  }
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const filteredTools = tools.filter(tool => 
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-tool-background text-white p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-center mb-4">Developer Tools</h1>
            <p className="text-gray-300 text-center">All the tools you need in one place</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-900" />
            )}
          </Button>
        </div>
        
        <SearchTools onSearch={setSearchQuery} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map(tool => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              isPro={tool.isPro}
              type={tool.type}
              onFormat={tool.format}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;