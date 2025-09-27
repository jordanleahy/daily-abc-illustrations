import { useState, useEffect, useRef, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, X, RotateCcw, Loader2 } from 'lucide-react';

interface UniversalInlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
  placeholder?: string;
  isEditing?: boolean;
  multiline?: boolean;
  renderDisplay?: (value: string) => React.ReactNode;
  onEditStart?: () => void;
  onEditCancel?: () => void;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  error?: string | null;
  hasChanges?: boolean;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
}

export const UniversalInlineEdit = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  UniversalInlineEditProps
>(({
  value,
  onSave,
  className,
  placeholder,
  isEditing: externalIsEditing,
  multiline = false,
  renderDisplay,
  onEditStart,
  onEditCancel,
  isSaving = false,
  saveStatus = 'idle',
  error,
  hasChanges = false,
  disabled = false,
  maxLength,
  rows = 3,
}, ref) => {
  const [editValue, setEditValue] = useState(value);
  const [isEditing, setIsEditing] = useState(externalIsEditing || false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (externalIsEditing !== undefined) {
      setIsEditing(externalIsEditing);
    }
  }, [externalIsEditing]);

  useEffect(() => {
    if (isEditing) {
      const element = multiline ? textareaRef.current : inputRef.current;
      if (element) {
        element.focus();
        element.select();
      }
    }
  }, [isEditing, multiline]);

  const handleStartEdit = () => {
    if (disabled || isSaving) return;
    setIsEditing(true);
    onEditStart?.();
  };

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }
    
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      // Error handling is managed by the parent hook
      console.error('Save failed:', error);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onEditCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
    
    if (multiline) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
      case 'saved':
        return <Check className="h-3 w-3 text-success" />;
      case 'error':
        return <X className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (error) return error;
    if (saveStatus === 'saving') return 'Saving...';
    if (saveStatus === 'saved') return 'Saved';
    return null;
  };

  if (!isEditing) {
    return (
      <div 
        onClick={handleStartEdit}
        className={cn(
          "cursor-pointer group relative",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        {renderDisplay ? renderDisplay(value) : (
          <span className={cn(
            "block py-1 px-2 rounded transition-colors",
            "group-hover:bg-muted/50",
            !value && "text-muted-foreground italic"
          )}>
            {value || placeholder || "Click to edit..."}
          </span>
        )}
        
        {/* Save status indicator */}
        {saveStatus !== 'idle' && (
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {getSaveStatusIcon()}
          </div>
        )}
      </div>
    );
  }

  const InputComponent = multiline ? Textarea : Input;
  const commonProps = {
    value: editValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
      setEditValue(e.target.value),
    onKeyDown: handleKeyDown,
    onBlur: handleSave,
    placeholder,
    className: cn(
      "min-h-0",
      multiline && "resize-none",
      className
    ),
    disabled: isSaving,
    maxLength,
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {multiline ? (
          <Textarea 
            ref={textareaRef}
            rows={rows}
            {...commonProps}
          />
        ) : (
          <Input 
            ref={inputRef}
            {...commonProps}
          />
        )}
        
        {/* Character count for textareas */}
        {multiline && maxLength && (
          <div className="absolute -bottom-5 right-0 text-xs text-muted-foreground">
            {editValue.length}/{maxLength}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="h-7"
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Save
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-7"
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>

          {hasChanges && !isSaving && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-7 text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>

        {/* Status message */}
        <div className="flex items-center gap-1 text-xs">
          {getSaveStatusIcon()}
          <span className={cn(
            "text-muted-foreground",
            saveStatus === 'error' && "text-destructive",
            saveStatus === 'saved' && "text-success"
          )}>
            {getStatusMessage()}
          </span>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-muted-foreground">
        {multiline ? 'Ctrl+Enter to save, Esc to cancel' : 'Enter to save, Esc to cancel'}
      </div>
    </div>
  );
});