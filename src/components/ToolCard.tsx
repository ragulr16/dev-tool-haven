import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Lock, BracketsIcon, FileCode, KeyRound, Database, FileText, Clock, Hash, Table, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useProLicense } from '@/hooks/use-pro-license';

interface FormatResult {
  result: string;
  rateLimits?: string;
}

interface ToolCardProps {
  title: string;
  description: string;
  isPro?: boolean;
  onFormat;
  isDarkMode;
  type?: 'json' | 'xml' | 'jwt' | 'sql' | 'base64' | 'url' | 'timestamp' | 'regex' | 'csv';
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, isPro = false, onFormat, type = 'json',isDarkMode }) => {
  const [input, setInput] = React.useState('');
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);
  const { toast } = useToast();
  const { isPro: hasProLicense } = useProLicense();
  const [rateLimits, setRateLimits] = useState<string | null>(null);

  // Determine if the tool is disabled
  const isDisabled = isPro && !hasProLicense;

  const getIcon = () => {
    switch (type) {
      case 'json':
        return <BracketsIcon className="w-6 h-6" />;
      case 'xml':
        return <FileCode className="w-6 h-6" />;
      case 'jwt':
        return <KeyRound className="w-6 h-6" />;
      case 'sql':
        return <Database className="w-6 h-6" />;
      case 'timestamp':
        return <Clock className="w-6 h-6" />;
      case 'regex':
        return <Hash className="w-6 h-6" />;
      case 'csv':
        return <Table className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const handleFormat = async () => {
    if (isDisabled) {
      toast({
        title: "Pro Feature",
        description: "This feature requires a Pro license. Please upgrade to access it.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setIsValidating(true);
    try {
      const result = await onFormat(input);
      if (typeof result === 'string') {
        setOutput(result);
        setRateLimits(null);
      } else {
        setOutput(result.result);
        setRateLimits(result.rateLimits || null);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while formatting');
      toast({
        title: "Error",
        description: err.message || 'An error occurred while formatting',
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCopy = () => {
    if (isDisabled) {
      toast({
        title: "Pro Feature",
        description: "This feature requires a Pro license. Please upgrade to access it.",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(output).then(() => {
      toast({
        title: "Copied!",
        description: "Output copied to clipboard",
      });
    });
  };

  return (
    <div className={`relative p-6 rounded-lg backdrop-blur-xl ${
      isDarkMode 
        ? `${isPro ? 'bg-gray-800/30' : 'bg-gray-800/50'} border-gray-700/50` 
        : `${isPro ? 'bg-[#bdbcc9]' : 'bg-gray-50'} border-gray-200`
    } border transition-all hover:border-tool-accent/50 ${isDisabled ? 'pro-locked' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        {getIcon()}
        <h3 className={`text-xl font-bold tracking-wide ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>{title}</h3>
      </div>
      <p className={`mb-5 text-sm leading-relaxed ${
        isDarkMode ? 'text-gray-300' : 'text-gray-600'
      }`}>{description}</p>
      
      <div className="space-y-4">
        <div>
          <Textarea
           className={`min-h-[100px] ${
            isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-100 border-gray-200'
          } font-medium ${error ? 'border-red-500' : ''} ${isDisabled ? 'opacity-50' : ''}`}
            // className="flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-700"
            placeholder="Input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isDisabled}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleFormat}
            disabled={isDisabled || !input || isValidating}
            className="bg-tool-accent hover:bg-tool-accent/80 text-white font-semibold shadow-lg shadow-tool-accent/20"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Format'
            )}
          </Button>
          <Button
            onClick={handleCopy}
            disabled={isDisabled || !output}
            variant="outline"
            className={`border-gray-700 text-gray-300 hover:bg-gray-700 font-medium ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            Copy
          </Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setError(null);
              setRateLimits(null);
            }}
            className={`border-gray-700 text-gray-300 hover:bg-gray-700 font-medium ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
            disabled={isDisabled}
            variant="outline"
          >
            Clear
          </Button>
        </div>
        <Textarea
        className={`min-h-[100px] ${
          isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-100 border-gray-200'
        } font-medium ${isDisabled ? 'opacity-50' : ''}`}
          // className="flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-700"
          placeholder="Output"
          value={error || output}
          readOnly
        />
        {rateLimits && (
          <p className="text-sm text-gray-400">{rateLimits}</p>
        )}
      </div>

      {isPro && !hasProLicense && (
        <a
          href="https://7902599025626.gumroad.com/l/oxuok"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg cursor-pointer hover:bg-black/70 transition-all"
        >
          <div className="text-center transform hover:scale-105 transition-transform">
            <Lock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <h4 className="text-lg font-semibold text-white mb-1">Pro Feature</h4>
            <p className="text-sm text-gray-300 hover:text-white">Upgrade to Pro</p>
          </div>
        </a>
      )}
    </div>
  );
};

export default ToolCard;