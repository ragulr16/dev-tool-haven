import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

interface SearchToolsProps {
  onSearch: (query: string) => void;
}

const SearchTools: React.FC<SearchToolsProps> = ({ onSearch }) => {
  return (
    <div className="relative w-full max-w-xl mx-auto mb-8">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <Input
        type="text"
        placeholder="Search tools..."
        onChange={(e) => onSearch(e.target.value)}
        className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 w-full"
      />
    </div>
  );
};

export default SearchTools;