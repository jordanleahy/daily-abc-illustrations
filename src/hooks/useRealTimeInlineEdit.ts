import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseRealTimeInlineEditOptions {
  tableName: string;
  recordId: string;
  initialValue: string;
  fieldName: string;
  debounceMs?: number;
  onSuccess?: (value: string) => void;
  onError?: (error: string) => void;
}

export const useRealTimeInlineEdit = ({
  tableName,
  recordId,
  initialValue,
  fieldName,
  debounceMs = 1000,
  onSuccess,
  onError
}: UseRealTimeInlineEditOptions) => {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const originalValueRef = useRef(initialValue);
  
  const { toast } = useToast();

  // Sync with external changes
  useEffect(() => {
    setValue(initialValue);
    originalValueRef.current = initialValue;
  }, [initialValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const saveToDatabase = useCallback(async (newValue: string) => {
    if (newValue === originalValueRef.current) {
      return; // No changes to save
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from(tableName as any)
        .update({ [fieldName]: newValue })
        .eq('id', recordId);

      if (updateError) {
        throw updateError;
      }

      // Success
      originalValueRef.current = newValue;
      setSaveStatus('saved');
      onSuccess?.(newValue);
      
      // Auto-clear saved status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      setError(errorMessage);
      setSaveStatus('error');
      onError?.(errorMessage);
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Revert value on error
      setValue(originalValueRef.current);
    } finally {
      setIsSaving(false);
    }
  }, [tableName, recordId, fieldName, onSuccess, onError, toast]);

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounced save
    timeoutRef.current = setTimeout(() => {
      saveToDatabase(newValue);
    }, debounceMs);
  }, [debounceMs, saveToDatabase]);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await saveToDatabase(value);
  }, [value, saveToDatabase]);

  const revert = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setValue(originalValueRef.current);
    setSaveStatus('idle');
    setError(null);
  }, []);

  const hasChanges = value !== originalValueRef.current;

  return {
    value,
    updateValue,
    saveNow,
    revert,
    isSaving,
    saveStatus,
    error,
    hasChanges,
  };
};