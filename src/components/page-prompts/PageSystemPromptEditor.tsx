import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, X, Loader2 } from 'lucide-react';

interface PageSystemPromptEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PageSystemPromptEditor({
  content,
  onContentChange,
  onSave,
  onCancel,
}: PageSystemPromptEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  const characterCount = content.length;
  const maxCharacters = 8000;

  const handleSave = async () => {
    if (isSaving || !content.trim() || characterCount > maxCharacters) return;
    
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Error saving page system prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter the system prompt for this page's visual content generation..."
          className="min-h-[200px] resize-none"
          maxLength={maxCharacters}
        />
        <div className="flex justify-between items-center">
          <Badge 
            variant={characterCount > maxCharacters * 0.9 ? "destructive" : "secondary"}
          >
            {characterCount}/{maxCharacters} characters
          </Badge>
          <div className="text-xs text-muted-foreground">
            Press Ctrl+S (Cmd+S) to save, Esc to cancel
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !content.trim() || characterCount > maxCharacters}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}