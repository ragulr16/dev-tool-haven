import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Lock, BracketsIcon, FileCode, KeyRound, Database, FileText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ToolCardProps {
  title: string;
  description: string;
  isPro?: boolean;
  onFormat?: (input: string) => string;
  type?: 'json' | 'xml' | 'jwt' | 'sql' | 'base64' | 'url';
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, isPro = false, onFormat, type = 'json' }) => {
  const [input, setInput] = React.useState('');
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

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
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const handleFormat = () => {
    if (isPro) {
      return;
    }
    
    try {
      if (onFormat) {
        setError(null);
        setOutput(onFormat(input));
      }
    } catch (err) {
      setError('Invalid input format');
      setOutput('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast({
      title: "Copied!",
      description: "Output copied to clipboard",
    });
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className={`relative p-6 rounded-lg backdrop-blur-xl ${isPro ? 'bg-gray-800/30' : 'bg-gray-800/50'} border border-gray-700/50 transition-all hover:border-tool-accent/50`}>
      {isPro && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="absolute inset-0 rounded-lg bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-3 cursor-pointer hover:bg-black/90 transition-all">
              <Lock className="w-8 h-8 text-tool-accent animate-pulse" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-white font-bold tracking-wide text-lg bg-gradient-to-r from-tool-accent via-purple-400 to-tool-accent bg-clip-text text-transparent px-4 py-1.5 rounded-full border-2 border-tool-accent/30 shadow-lg shadow-tool-accent/20 backdrop-blur-md">
                  Upgrade to Pro
                </span>
                <span className="text-sm font-medium text-gray-300 bg-black/40 px-3 py-1 rounded-full">Unlock Advanced Features</span>
              </div>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border border-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-tool-accent to-purple-400 bg-clip-text text-transparent">
                Unlock Pro Features
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Get access to advanced tools like JWT Decoder, SQL Formatter, and more with a Pro subscription.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button className="bg-tool-accent hover:bg-tool-accent/80 text-white font-semibold">
                Upgrade to Pro →
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      <div className="flex items-center gap-2 mb-3">
        {getIcon()}
        <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
      </div>
      <p className="text-gray-300 mb-5 text-sm leading-relaxed">{description}</p>
      
      <div className="space-y-4">
        <div>
          <Textarea
            placeholder="Input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`min-h-[100px] bg-gray-900/50 border-gray-700 font-medium ${error ? 'border-red-500' : ''} ${isPro ? 'opacity-50' : ''}`}
            disabled={isPro}
          />
          {error && (
            <p className="text-red-400 text-sm mt-1 font-medium">{error}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleFormat}
            className="bg-tool-accent hover:bg-tool-accent/80 text-white font-semibold shadow-lg shadow-tool-accent/20"
            disabled={isPro}
          >
            Format
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-700 font-medium"
            disabled={isPro || !output}
          >
            Copy
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-700 font-medium"
            disabled={isPro}
          >
            Clear
          </Button>
        </div>

        <Textarea
          placeholder="Output"
          value={output}
          readOnly
          className={`min-h-[100px] bg-gray-900/50 border-gray-700 font-medium ${isPro ? 'opacity-50' : ''}`}
          disabled={isPro}
        />
      </div>
    </div>
  );
};

export default ToolCard;