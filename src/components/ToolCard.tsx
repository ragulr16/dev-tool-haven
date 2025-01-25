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
  onFormat?: (input: string) => Promise<FormatResult | string>;
  type?: 'json' | 'xml' | 'jwt' | 'sql' | 'base64' | 'url' | 'timestamp' | 'regex' | 'csv';
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, isPro = false, onFormat, type = 'json' }) => {
  const [input, setInput] = React.useState('');
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);
  const { toast } = useToast();
  const { isPro: hasProLicense } = useProLicense();
  const [rateLimits, setRateLimits] = useState<string | null>(null);

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
    if (!onFormat) return;
    
    try {
      setError(null);
      setIsValidating(true);
      const result = await onFormat(input);
      if (typeof result === 'string') {
        setOutput(result);
      } else {
        setOutput(result.result);
        if (result.rateLimits) {
          setRateLimits(result.rateLimits);
        }
      }
    } catch (error) {
      console.error('Format error:', error);
      setError('Error formatting input');
      setOutput('');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast({
      title: "Copied!",
      description: "Output copied to clipboard.",
    });
  };

  const isDisabled = isPro && !hasProLicense;

  return (
    <div className={`relative p-6 rounded-lg backdrop-blur-xl bg-gray-800/30 border border-gray-700/50 transition-all hover:border-tool-accent/50 ${isPro && !hasProLicense ? 'pro-locked' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        {getIcon()}
        <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
      </div>
      <p className="text-gray-300 mb-5 text-sm leading-relaxed">{description}</p>
      
      <div className="space-y-4">
        <div>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-700"
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
            disabled={isDisabled}
            variant="outline"
          >
            Clear
          </Button>
        </div>
        <textarea
          className="flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-700"
          placeholder="Output"
          value={error || output}
          readOnly
        />
        {rateLimits && (
          <p className="text-sm text-gray-400">{rateLimits}</p>
        )}
      </div>

      {isPro && !hasProLicense && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg cursor-pointer">
          <div className="text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <h4 className="text-lg font-semibold text-white mb-1">Pro Feature</h4>
            <p className="text-sm text-gray-300">Upgrade to Pro</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCard;