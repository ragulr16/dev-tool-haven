import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Lock } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  isPro?: boolean;
  onFormat?: (input: string) => string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, isPro = false, onFormat }) => {
  const [input, setInput] = React.useState('');
  const [output, setOutput] = React.useState('');

  const handleFormat = () => {
    if (isPro) {
      toast({
        title: "Pro Feature",
        description: "This tool is only available with a Pro subscription",
      });
      return;
    }
    if (onFormat) {
      setOutput(onFormat(input));
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
  };

  return (
    <div className={`relative p-6 rounded-lg backdrop-blur-xl ${isPro ? 'bg-gray-800/30' : 'bg-gray-800/50'} border border-gray-700/50 transition-all hover:border-tool-accent/50`}>
      {isPro && (
        <div className="absolute inset-0 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center flex-col gap-2">
          <Lock className="w-8 h-8 text-tool-accent" />
          <span className="text-white font-medium">Upgrade to Pro</span>
        </div>
      )}
      
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-gray-400 mb-4 text-sm">{description}</p>
      
      <div className="space-y-4">
        <Textarea
          placeholder="Input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[100px] bg-gray-900/50 border-gray-700"
        />
        
        <div className="flex gap-2">
          <Button
            onClick={handleFormat}
            className="bg-tool-accent hover:bg-tool-accent/80 text-white"
          >
            Format
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            Copy
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            Clear
          </Button>
        </div>

        <Textarea
          placeholder="Output"
          value={output}
          readOnly
          className="min-h-[100px] bg-gray-900/50 border-gray-700"
        />
      </div>
    </div>
  );
};

export default ToolCard;