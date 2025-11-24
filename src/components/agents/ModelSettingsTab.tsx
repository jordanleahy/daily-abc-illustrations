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
    model: 'google/gemini-2.5-flash',
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={modelSettings.model}
            onChange={(e) => handleSettingChange('model', e.target.value)}
            placeholder="google/gemini-2.5-flash"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Enter the Lovable AI Gateway model name. Examples: google/gemini-2.5-flash (default), google/gemini-2.5-pro, openai/gpt-5-mini
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