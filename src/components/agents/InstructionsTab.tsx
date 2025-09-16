import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AgentConfig } from '@/types/agent';
import { useLatestBookSystemPrompt } from '@/hooks/useLatestBookSystemPrompt';
import { BookSystemPromptDisplay } from './BookSystemPromptDisplay';

interface InstructionsTabProps {
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onSaveWithOverrides: (configOverrides?: Partial<AgentConfig>) => Promise<void>;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  agentType?: string;
}

export const InstructionsTab = ({ 
  config, 
  onUpdate, 
  onSaveWithOverrides,
  isLoading, 
  hasUnsavedChanges,
  agentType 
}: InstructionsTabProps) => {
  const [localInstructions, setLocalInstructions] = useState(config?.instructions || '');
  const { promptData, isLoading: promptLoading, refetch } = useLatestBookSystemPrompt();

  // Show book system prompt display for graphics-designer agent
  if (agentType === 'graphics-designer') {
    return <BookSystemPromptDisplay 
      promptData={promptData} 
      isLoading={promptLoading} 
      onRefresh={refetch} 
    />;
  }

  // Sync local state with config changes - only when instructions actually change
  useEffect(() => {
    if (!hasUnsavedChanges && config?.instructions !== undefined && config.instructions !== localInstructions) {
      console.log('📝 InstructionsTab: Syncing instructions from config:', (config.instructions || '').substring(0, 50) + '...');
      setLocalInstructions(config.instructions);
    }
  }, [config?.instructions, hasUnsavedChanges]);

  const handleInstructionsChange = (value: string) => {
    setLocalInstructions(value);
    onUpdate({ instructions: value });
  };

  const handleSave = () => {
    // Use current local instructions to avoid timing issues
    onSaveWithOverrides({ instructions: localInstructions });
  };

  const handleReset = () => {
    const originalInstructions = config?.instructions || '';
    setLocalInstructions(originalInstructions);
    onUpdate({ instructions: originalInstructions });
  };

  const characterCount = localInstructions.length;
  const maxCharacters = 8000;
  const hasLocalChanges = localInstructions !== (config?.instructions || '');

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="instructions" className="block text-sm font-medium mb-2">
          System Instructions
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Define how your agent should behave, its personality, and capabilities. These instructions will guide all responses.
        </p>
        <Textarea
          id="instructions"
          value={localInstructions}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          placeholder="Enter detailed instructions for your agent..."
          className="w-full min-h-0 resize-none"
          style={{ height: 'auto', minHeight: 'auto' }}
          rows={Math.max(3, localInstructions.split('\n').length)}
          maxLength={maxCharacters}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-foreground">
            {characterCount}/{maxCharacters} characters
          </span>
          <div className="flex gap-2">
            {hasLocalChanges && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isLoading || !hasLocalChanges}
            >
              {isLoading ? 'Saving...' : 'Save Instructions'}
            </Button>
          </div>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="p-3 rounded-md bg-warning/10 border border-warning/20">
          <p className="text-sm text-warning-foreground">
            You have unsaved changes. Don't forget to save your instructions.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Best Practices</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Be specific about the agent's role and expertise</li>
          <li>• Define the tone and personality you want</li>
          <li>• Include any specific guidelines or limitations</li>
          <li>• Mention how to handle unknown or sensitive topics</li>
        </ul>
      </div>
    </div>
  );
};