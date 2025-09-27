import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsePerformantInlineEditOptions {
  tableName: string;
  recordId: string;
  initialValue: string;
  fieldName: string;
  debounceMs?: number;
  enableBatching?: boolean;
  onSuccess?: (value: string) => void;
  onError?: (error: string) => void;
}

// Global batch manager for performance
class BatchManager {
  private batches = new Map<string, Map<string, any>>();
  private batchTimeouts = new Map<string, NodeJS.Timeout>();
  
  add(tableName: string, recordId: string, fieldName: string, value: any, onComplete: (success: boolean) => void) {
    const batchKey = `${tableName}:${recordId}`;
    
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, new Map());
    }
    
    const batch = this.batches.get(batchKey)!;
    batch.set(fieldName, { value, onComplete });
    
    // Clear existing timeout
    if (this.batchTimeouts.has(batchKey)) {
      clearTimeout(this.batchTimeouts.get(batchKey)!);
    }
    
    // Set new timeout for batch execution
    const timeout = setTimeout(() => {
      this.executeBatch(tableName, recordId, batchKey);
    }, 300); // Fast batch execution
    
    this.batchTimeouts.set(batchKey, timeout);
  }
  
  private async executeBatch(tableName: string, recordId: string, batchKey: string) {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.size === 0) return;
    
    try {
      // Prepare update object
      const updates: Record<string, any> = {};
      const callbacks: Array<(success: boolean) => void> = [];
      
      batch.forEach(({ value, onComplete }, fieldName) => {
        updates[fieldName] = value;
        callbacks.push(onComplete);
      });
      
      // Single database update for all fields
      const { error } = await supabase
        .from(tableName as any)
        .update(updates)
        .eq('id', recordId);
      
      // Notify all callbacks
      callbacks.forEach(callback => callback(!error));
      
    } catch (error) {
      // Notify all callbacks of failure
      const callbacks: Array<(success: boolean) => void> = [];
      batch.forEach(({ onComplete }) => callbacks.push(onComplete));
      callbacks.forEach(callback => callback(false));
    }
    
    // Cleanup
    this.batches.delete(batchKey);
    this.batchTimeouts.delete(batchKey);
  }
  
  cancel(tableName: string, recordId: string) {
    const batchKey = `${tableName}:${recordId}`;
    if (this.batchTimeouts.has(batchKey)) {
      clearTimeout(this.batchTimeouts.get(batchKey)!);
      this.batchTimeouts.delete(batchKey);
    }
    this.batches.delete(batchKey);
  }
}

const batchManager = new BatchManager();

// Request cache for deduplication
const requestCache = new Map<string, Promise<any>>();

export const usePerformantInlineEdit = ({
  tableName,
  recordId,
  initialValue,
  fieldName,
  debounceMs = 250, // Faster default debounce
  enableBatching = true,
  onSuccess,
  onError
}: UsePerformantInlineEditOptions) => {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const originalValueRef = useRef(initialValue);
  const isUnmountedRef = useRef(false);
  
  const { toast } = useToast();

  // Memoized cache key for request deduplication
  const cacheKey = useMemo(() => 
    `${tableName}:${recordId}:${fieldName}`, 
    [tableName, recordId, fieldName]
  );

  // Sync with external changes (memoized)
  useEffect(() => {
    if (initialValue !== originalValueRef.current) {
      setValue(initialValue);
      originalValueRef.current = initialValue;
      setSaveStatus('idle');
      setError(null);
    }
  }, [initialValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (enableBatching) {
        batchManager.cancel(tableName, recordId);
      }
    };
  }, [tableName, recordId, enableBatching]);

  // Memoized save function with request deduplication
  const saveToDatabase = useCallback(async (newValue: string) => {
    if (newValue === originalValueRef.current || isUnmountedRef.current) {
      return;
    }

    const requestKey = `${cacheKey}:${newValue}`;
    
    // Check for existing request
    if (requestCache.has(requestKey)) {
      return requestCache.get(requestKey);
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    const savePromise = (async () => {
      try {
        if (enableBatching) {
          // Use batch manager for better performance
          return new Promise<void>((resolve, reject) => {
            batchManager.add(tableName, recordId, fieldName, newValue, (success) => {
              if (isUnmountedRef.current) return;
              
              if (success) {
                originalValueRef.current = newValue;
                setSaveStatus('saved');
                onSuccess?.(newValue);
                resolve();
              } else {
                reject(new Error('Batch save failed'));
              }
            });
          });
        } else {
          // Direct save for non-batched operations
          const { error: updateError } = await supabase
            .from(tableName as any)
            .update({ [fieldName]: newValue })
            .eq('id', recordId);

          if (updateError) throw updateError;

          originalValueRef.current = newValue;
          setSaveStatus('saved');
          onSuccess?.(newValue);
        }

        // Auto-clear saved status
        setTimeout(() => {
          if (!isUnmountedRef.current) {
            setSaveStatus('idle');
          }
        }, 1500);

      } catch (err) {
        if (isUnmountedRef.current) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Save failed';
        setError(errorMessage);
        setSaveStatus('error');
        onError?.(errorMessage);
        
        // Only show toast for non-batch errors (batch shows its own)
        if (!enableBatching) {
          toast({
            title: "Save Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
        
        setValue(originalValueRef.current); // Revert on error
      } finally {
        if (!isUnmountedRef.current) {
          setIsSaving(false);
        }
        requestCache.delete(requestKey);
      }
    })();

    requestCache.set(requestKey, savePromise);
    return savePromise;
  }, [tableName, recordId, fieldName, cacheKey, enableBatching, onSuccess, onError, toast]);

  // Memoized update function
  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Fast debounced save
    timeoutRef.current = setTimeout(() => {
      saveToDatabase(newValue);
    }, debounceMs);
  }, [debounceMs, saveToDatabase]);

  // Memoized immediate save
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return saveToDatabase(value);
  }, [value, saveToDatabase]);

  // Memoized revert function
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