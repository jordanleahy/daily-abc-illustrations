import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { AgentConfig } from "@/types/agent";
import type { AIProvider } from "@/types/shared/agent";

interface ProviderModelTabProps {
  config?: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
}

const OPENAI_MODELS = [
  { value: 'gpt-5-2025-08-07', label: 'GPT-5 (Latest)', description: 'Flagship model with best performance' },
  { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini', description: 'Faster, cost-efficient' },
  { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano', description: 'Fastest, cheapest' },
  { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1', description: 'Reliable GPT-4 flagship' },
  { value: 'o3-2025-04-16', label: 'O3', description: 'Advanced reasoning' },
  { value: 'o4-mini-2025-04-16', label: 'O4 Mini', description: 'Fast reasoning' },
  { value: 'gpt-4o', label: 'GPT-4o (Legacy)', description: 'Vision capable (legacy)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Legacy)', description: 'Fast vision (legacy)' },
];

const DEEPSEEK_MODELS = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat', description: 'General conversation model' },
  { value: 'deepseek-coder', label: 'DeepSeek Coder', description: 'Specialized for code generation' },
];

const GOOGLE_MODELS = [
  { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)', description: 'Latest experimental model' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Most capable for complex reasoning' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Fast and versatile' },
  { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash-8B', description: 'Smallest and fastest' },
];

export function ProviderModelTab({ config, onUpdate }: ProviderModelTabProps) {
  const provider = config?.provider || 'openai';
  const models = provider === 'openai' 
    ? OPENAI_MODELS 
    : provider === 'deepseek' 
      ? DEEPSEEK_MODELS 
      : GOOGLE_MODELS;
  const currentModel = config?.modelSettings.model || '';

  const handleProviderChange = (newProvider: AIProvider) => {
    const defaultModel = newProvider === 'openai' 
      ? 'gpt-5-2025-08-07' 
      : newProvider === 'deepseek' 
        ? 'deepseek-chat'
        : 'gemini-1.5-flash';
    onUpdate({
      provider: newProvider,
      modelSettings: {
        ...config?.modelSettings!,
        model: defaultModel,
      },
    });
  };

  const handleModelChange = (model: string) => {
    onUpdate({
      modelSettings: {
        ...config?.modelSettings!,
        model,
      },
    });
  };

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="provider">AI Provider</Label>
          <Select
            value={provider}
            onValueChange={handleProviderChange}
          >
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="deepseek">DeepSeek</SelectItem>
              <SelectItem value="google">Google Gemini</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {provider === 'openai' 
              ? 'OpenAI models offer GPT-5 and advanced reasoning capabilities'
              : provider === 'deepseek'
                ? 'DeepSeek models are optimized for conversation and code generation'
                : 'Google Gemini models offer multimodal capabilities and fast performance'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select
            value={currentModel}
            onValueChange={handleModelChange}
          >
            <SelectTrigger id="model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex flex-col">
                    <span>{model.label}</span>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {models.find(m => m.value === currentModel)?.description || 'Select a model'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
