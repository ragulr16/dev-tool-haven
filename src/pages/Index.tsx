import React, { useState } from 'react';
import ToolCard from '@/components/ToolCard';
import SearchTools from '@/components/SearchTools';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tools = [
  {
    id: 1,
    title: "JSON Formatter",
    description: "Format and validate JSON data with syntax highlighting",
    isPro: false,
    type: "json" as const,
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
    type: "base64" as const,
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
    type: "url" as const,
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
    title: "JWT Decoder",
    description: "Decode and verify JWT tokens",
    isPro: true,
    type: "jwt" as const
  },
  {
    id: 5,
    title: "SQL Formatter",
    description: "Format SQL queries with proper indentation",
    isPro: true,
    type: "sql" as const
  },
  {
    id: 6,
    title: "XML Formatter",
    description: "Format XML documents with proper indentation",
    isPro: true,
    type: "xml" as const
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