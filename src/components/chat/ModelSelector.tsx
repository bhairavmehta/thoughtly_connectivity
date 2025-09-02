
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Globe, HelpCircle } from 'lucide-react';

export type ModelType = {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'google' | 'anthropic';
};

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const models: ModelType[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'OpenAI\'s most powerful model with vision capabilities, excellent for complex tasks and reasoning.',
      provider: 'openai'
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      description: 'Faster and more cost-effective version of GPT-4o with slightly reduced capabilities but still powerful.',
      provider: 'openai'
    },
    {
      id: 'claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      description: 'Anthropic\'s advanced model with strong reasoning, creativity, and nuanced understanding of context.',
      provider: 'anthropic'
    },
    {
      id: 'grok-2',
      name: 'Grok 2',
      description: 'xAI\'s conversational model focused on personality, wit, and comprehensive knowledge across domains.',
      provider: 'google'
    }
  ];

  const selectedModelData = models.find(m => m.id === selectedModel) || models[0];

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="w-auto h-6 text-xs rounded-full px-2 py-1 bg-transparent border-none text-gray-400 hover:text-white hover:bg-thoughtly-muted/40 focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <SelectValue>{selectedModelData.name}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent 
          className="bg-thoughtly-card border-thoughtly-border z-50 max-h-[300px] overflow-y-auto"
          position="popper"
          side="bottom"
          align="start"
        >
          {models.map((model) => (
            <HoverCard key={model.id} openDelay={150} closeDelay={100}>
              <HoverCardTrigger asChild>
                <SelectItem 
                  value={model.id}
                  className="text-sm focus:bg-thoughtly-muted cursor-pointer"
                >
                  <span>{model.name}</span>
                </SelectItem>
              </HoverCardTrigger>
              <HoverCardContent
                side="right"
                align="start"
                sideOffset={5}
                className="bg-thoughtly-card border-thoughtly-border text-thoughtly-foreground p-3 text-xs max-w-[250px] z-[60]"
                avoidCollisions={true}
              >
                {model.description}
              </HoverCardContent>
            </HoverCard>
          ))}
        </SelectContent>
      </Select>
      
      {/* Help button with tooltip explaining models */}
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 rounded-full p-0 flex items-center justify-center"
          >
            <HelpCircle className="h-3 w-3 text-gray-400 hover:text-white" />
          </Button>
        </TooltipTrigger>
        <TooltipContent 
          className="bg-thoughtly-card border-thoughtly-border text-thoughtly-foreground p-3 text-xs max-w-[250px] z-[60]"
          sideOffset={5}
        >
          <p>Switch between different AI models to get varied responses.</p>
          <ul className="mt-2 space-y-1 list-disc pl-4">
            <li><span className="font-semibold">GPT-4o:</span> Powerful reasoning & vision</li>
            <li><span className="font-semibold">GPT-4o Mini:</span> Fast & efficient</li>
            <li><span className="font-semibold">Claude 3.5:</span> Creative & nuanced</li>
            <li><span className="font-semibold">Grok 2:</span> Witty & comprehensive</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
