import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AgentConfig } from '@/types/agent';

interface ModelSettingsTabProps {
  config: AgentConfig;
  onUpdate: (settings: Partial<AgentConfig['modelSettings']>) => void;
  onSaveWithOverrides: (configOverrides?: Partial<AgentConfig>) => Promise<void>;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
}

export const ModelSettingsTab = ({ 
  config, 
  onUpdate, 
  onSaveWithOverrides, 
  isLoading, 
  hasUnsavedChanges 
}: ModelSettingsTabProps) => {
  // Use parent's state management instead of local duplication
  const modelSettings = config?.modelSettings || {
    model: 'gpt-4o',
    maxCompletionTokens: 1000,
    topP: 1.0
  };

  const handleSettingChange = (key: keyof AgentConfig['modelSettings'], value: string | number) => {
    onUpdate({ [key]: value });
  };

  const handleSave = async () => {
    await onSaveWithOverrides();
  };

  const handleReset = () => {
    // Reset to original values by calling onUpdate with original model settings
    if (config?.modelSettings) {
      onUpdate({
        model: config.modelSettings.model,
        maxCompletionTokens: config.modelSettings.maxCompletionTokens,
        topP: config.modelSettings.topP
      });
    }
  };

  const providerInfo = {
    openai: {
      name: 'OpenAI',
      models: ['gpt-5-2025-08-07', 'gpt-5-mini-2025-08-07', 'gpt-5-nano-2025-08-07', 'gpt-4o', 'gpt-4o-mini'],
      secretKey: 'OPENAI_API_KEY'
    },
    google: {
      name: 'Google Gemini',
      models: ['gemini-2.5-pro-preview', 'gemini-2.5-flash-preview', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      secretKey: 'GOOGLE_API_KEY'
    },
    deepseek: {
      name: 'DeepSeek',
      models: ['deepseek-chat', 'deepseek-coder'],
      secretKey: 'DEEPSEEK_API_KEY'
    }
  };

  const currentProvider = config.provider || 'openai';
  const info = providerInfo[currentProvider];

  return (
    <div className="space-y-6">
      {/* Provider Information */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-foreground">Current Provider: {info.name}</p>
            <p className="text-xs text-muted-foreground">
              This system uses direct API calls to {info.name}. Make sure <span className="font-mono bg-muted px-1 py-0.5 rounded">{info.secretKey}</span> is configured in your Supabase Edge Function Secrets.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">Valid models:</span> <span className="font-mono">{info.models.slice(0, 3).join(', ')}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={modelSettings.model}
            onChange={(e) => handleSettingChange('model', e.target.value)}
            placeholder={`e.g., ${info.models[0]}`}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Enter the exact model name from {info.name}. Copy/paste recommended to avoid typos.
          </p>
        </div>

        {/* Maximum Completion Tokens */}
        <div className="space-y-2">
          <Label htmlFor="max-completion-tokens">Maximum Completion Tokens</Label>
          <Input
            id="max-completion-tokens"
            type="number"
            value={modelSettings.maxCompletionTokens}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              const validValue = isNaN(value) ? 1000 : Math.max(1, Math.min(32000, value));
              handleSettingChange('maxCompletionTokens', validValue);
            }}
            className="w-full"
            min="1"
            max="32000"
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of tokens in the completion response. Approximate: 1 token ≈ 0.75 words.
          </p>
        </div>

        {/* Top P */}
        <div className="space-y-2">
          <Label htmlFor="top-p">Top P</Label>
          <Input
            id="top-p"
            type="number"
            value={modelSettings.topP}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              const validValue = isNaN(value) ? 1.0 : Math.max(0.01, Math.min(1.0, value));
              handleSettingChange('topP', validValue);
            }}
            className="w-full"
            min="0.01"
            max="1.0"
            step="0.01"
          />
          <p className="text-xs text-muted-foreground">
            Controls diversity via nucleus sampling. 1.0 means no restrictions.
          </p>
        </div>
      </div>

      {/* Save Controls */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        {hasUnsavedChanges && (
          <Button 
            variant="ghost" 
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </Button>
        )}
        <Button 
          onClick={handleSave}
          disabled={isLoading || !hasUnsavedChanges}
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {hasUnsavedChanges && (
        <div className="p-3 rounded-md bg-warning/10 border border-warning/20">
          <p className="text-sm text-warning-foreground">
            You have unsaved model settings changes.
          </p>
        </div>
      )}
    </div>
  );
};