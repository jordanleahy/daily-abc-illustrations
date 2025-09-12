import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, X, FileText } from 'lucide-react';

interface SystemPromptEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const SystemPromptEditor = ({
  content,
  onContentChange,
  onSave,
  onCancel
}: SystemPromptEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  
  const characterCount = content.length;
  const maxCharacters = 5000; // Reasonable limit for system prompts
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save with Ctrl+S or Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Cancel with Escape
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <h4 className="font-medium">Edit System Prompt</h4>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={characterCount > maxCharacters ? "destructive" : "secondary"}
            className="text-xs"
          >
            {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()}
          </Badge>
        </div>
      </div>
      
      <Textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your system prompt for illustration generation..."
        className="min-h-[300px] font-mono text-sm resize-none"
        maxLength={maxCharacters}
      />
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+S</kbd> to save, 
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-1">Esc</kbd> to cancel
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || characterCount > maxCharacters}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};