import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AgentConfig, AVAILABLE_MODELS } from '@/types/agent';
import { useState } from 'react';

interface ModelSettingsTabProps {
  config: AgentConfig;
  onUpdate: (settings: Partial<AgentConfig['modelSettings']>) => void;
  onSave: () => void;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
}

export const ModelSettingsTab = ({ 
  config, 
  onUpdate, 
  onSave, 
  isLoading, 
  hasUnsavedChanges 
}: ModelSettingsTabProps) => {
  const [localSettings, setLocalSettings] = useState(config.modelSettings);

  const handleSettingChange = (key: keyof AgentConfig['modelSettings'], value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdate(newSettings);
  };

  const handleSave = () => {
    onSave();
  };

  const handleReset = () => {
    setLocalSettings(config.modelSettings);
    onUpdate(config.modelSettings);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={localSettings.model}
            onChange={(e) => handleSettingChange('model', e.target.value)}
            placeholder="Enter model name (e.g., gpt-4o)"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Enter the AI model name for your agent. Examples: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
          </p>
        </div>

        {/* Temperature Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="temperature-toggle">Temperature Control</Label>
            <Switch
              id="temperature-toggle"
              checked={localSettings.useTemperature}
              onCheckedChange={(checked) => handleSettingChange('useTemperature', checked)}
            />
          </div>
          
          {localSettings.useTemperature ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Temperature: {localSettings.temperature?.toFixed(1)}</span>
              </div>
              <Slider
                value={[localSettings.temperature || 0.7]}
                onValueChange={([value]) => handleSettingChange('temperature', value)}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Lower values (0.0-0.3) for focused responses, higher values (0.7-1.0) for creative responses.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Using default temperature settings optimized for your selected model.
            </p>
          )}
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <Label htmlFor="max-tokens">Maximum Response Length (tokens)</Label>
          <Input
            id="max-tokens"
            type="number"
            value={localSettings.maxTokens}
            onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value) || 1000)}
            min={1}
            max={4000}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of tokens in the response. Approximate: 1 token ≈ 0.75 words.
          </p>
        </div>

        {/* Top P */}
        <div className="space-y-2">
          <Label htmlFor="top-p">Top P</Label>
          <Input
            id="top-p"
            type="number"
            value={localSettings.topP}
            onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value) || 1.0)}
            min={0.1}
            max={1.0}
            step={0.1}
            className="w-full"
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
        <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You have unsaved model settings changes.
          </p>
        </div>
      )}
    </div>
  );
};