import React, { useState } from 'react';
import ToolCard from '@/components/ToolCard';
import SearchTools from '@/components/SearchTools';

const tools = [
  {
    id: 1,
    title: "JSON Formatter",
    description: "Format and validate JSON data with syntax highlighting",
    isPro: false,
    format: (input: string) => {
      try {
        return JSON.stringify(JSON.parse(input), null, 2);
      } catch (e) {
        return "Invalid JSON";
      }
    }
  },
  {
    id: 2,
    title: "Base64 Encoder",
    description: "Encode and decode Base64 strings",
    isPro: false,
    format: (input: string) => {
      try {
        return btoa(input);
      } catch (e) {
        return "Invalid input";
      }
    }
  },
  {
    id: 3,
    title: "URL Encoder",
    description: "Encode and decode URLs",
    isPro: false,
    format: (input: string) => {
      try {
        return encodeURIComponent(input);
      } catch (e) {
        return "Invalid input";
      }
    }
  },
  {
    id: 4,
    title: "JWT Decoder",
    description: "Decode and verify JWT tokens",
    isPro: true
  },
  {
    id: 5,
    title: "SQL Formatter",
    description: "Format SQL queries with proper indentation",
    isPro: true
  },
  {
    id: 6,
    title: "XML Formatter",
    description: "Format XML documents with proper indentation",
    isPro: true
  }
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTools = tools.filter(tool => 
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-tool-background text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Developer Tools</h1>
        <p className="text-gray-400 text-center mb-8">All the tools you need in one place</p>
        
        <SearchTools onSearch={setSearchQuery} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map(tool => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              isPro={tool.isPro}
              onFormat={tool.format}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;