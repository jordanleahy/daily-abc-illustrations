import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseOptimisticInlineEditOptions<T = string> {
  initialValue: T;
  onSave: (value: T) => Promise<void>;
  debounceMs?: number;
  maxRetries?: number;
  validateFn?: (value: T) => string | null;
}

export const useOptimisticInlineEdit = <T = string>({
  initialValue,
  onSave,
  debounceMs = 1000,
  maxRetries = 3,
  validateFn
}: UseOptimisticInlineEditOptions<T>) => {
  const [value, setValue] = useState<T>(initialValue);
  const [originalValue, setOriginalValue] = useState<T>(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const abortControllerRef = useRef<AbortController>();
  const retryCountRef = useRef(0);
  
  const { toast } = useToast();

  // Sync with external changes
  useEffect(() => {
    if (!isEditing && initialValue !== originalValue) {
      setValue(initialValue);
      setOriginalValue(initialValue);
      setSaveStatus('idle');
      setError(null);
    }
  }, [initialValue, isEditing, originalValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const startEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
    setSaveStatus('idle');
  }, []);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setValue(originalValue);
    setError(null);
    setSaveStatus('idle');
    
    // Clear any pending saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [originalValue]);

  const performSave = useCallback(async (valueToSave: T) => {
    // Prevent duplicate saves
    if (savePromiseRef.current) {
      return savePromiseRef.current;
    }

    // Validate if validation function provided
    if (validateFn) {
      const validationError = validateFn(valueToSave);
      if (validationError) {
        setError(validationError);
        setSaveStatus('error');
        return;
      }
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    // Create abort controller for this save operation
    abortControllerRef.current = new AbortController();

    const savePromise = (async () => {
      try {
        await onSave(valueToSave);
        
        // Check if operation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setOriginalValue(valueToSave);
        setSaveStatus('saved');
        retryCountRef.current = 0;
        
        // Auto-clear saved status after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
        
      } catch (error) {
        // Check if operation was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        console.error('Save failed:', error);
        retryCountRef.current++;
        
        if (retryCountRef.current < maxRetries) {
          // Exponential backoff retry
          const retryDelay = Math.pow(2, retryCountRef.current) * 1000;
          setTimeout(() => {
            savePromiseRef.current = null;
            performSave(valueToSave);
          }, retryDelay);
        } else {
          setError(error instanceof Error ? error.message : 'Save failed');
          setSaveStatus('error');
          setValue(originalValue); // Revert optimistic update
          
          toast({
            title: "Save Failed",
            description: "Changes could not be saved. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setIsSaving(false);
        savePromiseRef.current = null;
      }
    })();

    savePromiseRef.current = savePromise;
    return savePromise;
  }, [onSave, validateFn, maxRetries, originalValue, toast]);

  const updateValue = useCallback((newValue: T) => {
    setValue(newValue);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't auto-save if value hasn't actually changed
    if (JSON.stringify(newValue) === JSON.stringify(originalValue)) {
      return;
    }

    // Debounced auto-save
    timeoutRef.current = setTimeout(() => {
      performSave(newValue);
    }, debounceMs);
  }, [originalValue, debounceMs, performSave]);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await performSave(value);
  }, [value, performSave]);

  const hasChanges = JSON.stringify(value) !== JSON.stringify(originalValue);

  return {
    value,
    updateValue,
    isEditing,
    startEdit,
    cancelEdit,
    saveNow,
    isSaving,
    saveStatus,
    error,
    hasChanges,
    canSave: hasChanges && !isSaving,
  };
};