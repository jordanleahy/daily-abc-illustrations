import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AgentConfig } from '@/types/agent';

interface InstructionsTabProps {
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onSave: () => void;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
}

export const InstructionsTab = ({ 
  config, 
  onUpdate, 
  onSave, 
  isLoading, 
  hasUnsavedChanges 
}: InstructionsTabProps) => {
  const [localInstructions, setLocalInstructions] = useState(config.instructions);

  const handleSave = () => {
    onUpdate({ instructions: localInstructions });
    onSave();
  };

  const handleReset = () => {
    setLocalInstructions(config.instructions);
  };

  const characterCount = localInstructions.length;
  const maxCharacters = 8000;

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
          onChange={(e) => setLocalInstructions(e.target.value)}
          placeholder="Enter detailed instructions for your agent..."
          className="w-full"
          maxLength={maxCharacters}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-foreground">
            {characterCount}/{maxCharacters} characters
          </span>
          <div className="flex gap-2">
            {localInstructions !== config.instructions && (
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
              disabled={isLoading || localInstructions === config.instructions}
            >
              {isLoading ? 'Saving...' : 'Save Instructions'}
            </Button>
          </div>
        </div>
      </div>

      {hasUnsavedChanges && (
        <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
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