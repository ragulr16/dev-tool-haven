import  { useState } from 'react';
import * as React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface SearchToolsProps {
  onSearch: (query: string) => void;
  isDarkMode: boolean;
}

const SearchTools: React.FC<SearchToolsProps> = ({ onSearch, isDarkMode }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const toolSuggestions = [
    'JSON Formatter',
    'Base64 Encoder',
    'URL Encoder',
    'JWT Decoder',
    'SQL Formatter',
    'XML Formatter'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);

    // Update suggestions
    if (value.trim()) {
      const filtered = toolSuggestions.filter(tool =>
        tool.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto mb-8">
      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} w-5 h-5`}/>
      <Input
        type="text"
        placeholder="Search tools..."
        value={query}
        onChange={handleInputChange}
        className={`pl-10 w-full ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-400' 
            : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-500'
        }`}
      />
      {suggestions.length > 0 && (
        <div className={`absolute w-full mt-1 border rounded-md shadow-lg z-10 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`w-full justify-start text-left ${
                isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchTools;