import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Save, X, RotateCcw, Edit3 } from 'lucide-react';

interface OptimizedInlineEditProps {
  value: string;
  onSave: (value: string) => void | Promise<void>;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  renderDisplay?: (value: string, onClick: () => void) => React.ReactNode;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  error?: string | null;
  hasChanges?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  rows?: number;
  
  // Performance optimizations
  debounce?: number;
  validateOnChange?: (value: string) => string | null;
}

const OptimizedInlineEditComponent = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  OptimizedInlineEditProps
>(({
  value,
  onSave,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  multiline = false,
  placeholder = "Click to edit...",
  className,
  renderDisplay,
  isSaving = false,
  saveStatus = 'idle',
  error,
  hasChanges = false,
  disabled = false,
  autoFocus = true,
  maxLength,
  rows = 3,
  debounce = 300,
  validateOnChange
}, ref) => {
  const [localValue, setLocalValue] = useState(value);
  const [localError, setLocalError] = useState<string | null>(null);
  const [internalEditing, setInternalEditing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // Get the appropriate ref based on multiline
  const elementRef = multiline ? textareaRef : inputRef;
  
  const actuallyEditing = isEditing || internalEditing;

  // Sync with external value changes
  useEffect(() => {
    if (!actuallyEditing) {
      setLocalValue(value);
      setLocalError(null);
    }
  }, [value, actuallyEditing]);

  // Focus and select text when editing starts
  useEffect(() => {
    if (actuallyEditing && elementRef.current && autoFocus) {
      elementRef.current.focus();
      if (elementRef.current instanceof HTMLInputElement) {
        elementRef.current.select();
      } else if (elementRef.current instanceof HTMLTextAreaElement) {
        elementRef.current.setSelectionRange(0, elementRef.current.value.length);
      }
    }
  }, [actuallyEditing, autoFocus, elementRef]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleStartEdit = useCallback(() => {
    if (disabled) return;
    
    setLocalValue(value);
    setLocalError(null);
    
    if (onStartEdit) {
      onStartEdit();
    } else {
      setInternalEditing(true);
    }
  }, [disabled, value, onStartEdit]);

  const handleSave = useCallback(async () => {
    // Validate if validator provided
    if (validateOnChange) {
      const validationError = validateOnChange(localValue);
      if (validationError) {
        setLocalError(validationError);
        return;
      }
    }

    try {
      await onSave(localValue);
      
      if (onCancelEdit) {
        onCancelEdit();
      } else {
        setInternalEditing(false);
      }
      setLocalError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Save failed';
      setLocalError(errorMsg);
    }
  }, [localValue, onSave, onCancelEdit, validateOnChange]);

  const handleCancel = useCallback(() => {
    setLocalValue(value);
    setLocalError(null);
    
    if (onCancelEdit) {
      onCancelEdit();
    } else {
      setInternalEditing(false);
    }
  }, [value, onCancelEdit]);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    setLocalError(null);

    // Optional real-time validation with debounce
    if (validateOnChange && debounce > 0) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        const validationError = validateOnChange(newValue);
        setLocalError(validationError);
      }, debounce);
    }
  }, [validateOnChange, debounce]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && (!multiline || (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      handleSave();
    }
  }, [handleCancel, handleSave, multiline]);

  // Render status indicator
  const StatusIndicator = memo(() => {
    if (saveStatus === 'saving' || isSaving) {
      return <Badge variant="secondary" className="text-xs">Saving...</Badge>;
    }
    if (saveStatus === 'saved') {
      return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Saved</Badge>;
    }
    if (saveStatus === 'error' || error || localError) {
      return <Badge variant="destructive" className="text-xs">Error</Badge>;
    }
    if (hasChanges) {
      return <Badge variant="outline" className="text-xs">Unsaved</Badge>;
    }
    return null;
  });

  if (!actuallyEditing) {
    // Display mode
    const displayContent = renderDisplay ? 
      renderDisplay(value, handleStartEdit) : (
        <div
          onClick={handleStartEdit}
          className={cn(
            "min-h-[2rem] px-3 py-2 rounded-md border border-transparent cursor-pointer",
            "hover:border-border hover:bg-muted/50 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label="Click to edit"
        >
          {value || (
            <span className="text-muted-foreground italic">
              {placeholder}
            </span>
          )}
          <Edit3 className="inline-block ml-2 h-3 w-3 opacity-50" />
        </div>
      );

    return (
      <div className="space-y-1">
        {displayContent}
        <div className="flex items-center justify-between">
          <StatusIndicator />
          {(error || localError) && (
            <span className="text-xs text-destructive">
              {error || localError}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-2">
      {multiline ? (
        <Textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving || disabled}
          maxLength={maxLength}
          rows={rows}
          className={cn(
            "transition-all",
            (error || localError) && "border-destructive focus:border-destructive",
            className
          )}
          aria-invalid={!!(error || localError)}
          aria-describedby={error || localError ? "error-message" : undefined}
        />
      ) : (
        <Input
          ref={inputRef}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving || disabled}
          maxLength={maxLength}
          className={cn(
            "transition-all",
            (error || localError) && "border-destructive focus:border-destructive",
            className
          )}
          aria-invalid={!!(error || localError)}
          aria-describedby={error || localError ? "error-message" : undefined}
        />
      )}
      
      {/* Action buttons and status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !!(localError && validateOnChange)}
            className="h-7"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                Saving
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-1" />
                Save
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-7"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          {hasChanges && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLocalValue(value)}
              disabled={isSaving}
              className="h-7"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <StatusIndicator />
          {maxLength && (
            <span className={cn(
              "text-xs",
              localValue.length > maxLength * 0.9 ? "text-warning" : "text-muted-foreground",
              localValue.length >= maxLength && "text-destructive"
            )}>
              {localValue.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {(error || localError) && (
        <p id="error-message" className="text-xs text-destructive">
          {error || localError}
        </p>
      )}
      
      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-muted-foreground">
        <kbd className="px-1 py-0.5 text-xs bg-muted border rounded">Enter</kbd> to save
        {multiline && (
          <>
            {" · "}
            <kbd className="px-1 py-0.5 text-xs bg-muted border rounded">Ctrl+Enter</kbd> to save multi-line
          </>
        )}
        {" · "}
        <kbd className="px-1 py-0.5 text-xs bg-muted border rounded">Esc</kbd> to cancel
      </div>
    </div>
  );
});

OptimizedInlineEditComponent.displayName = "OptimizedInlineEdit";

// Memoize the component to prevent unnecessary re-renders
export const OptimizedInlineEdit = memo(OptimizedInlineEditComponent);