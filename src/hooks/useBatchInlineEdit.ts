import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FieldConfig {
  fieldName: string;
  initialValue: string;
  debounceMs?: number;
}

interface UseBatchInlineEditOptions {
  tableName: string;
  recordId: string;
  fields: FieldConfig[];
  batchDebounceMs?: number;
  onSuccess?: (savedFields: Record<string, string>) => void;
  onError?: (error: string) => void;
}

interface FieldState {
  value: string;
  originalValue: string;
  hasChanges: boolean;
}

export const useBatchInlineEdit = ({
  tableName,
  recordId,
  fields,
  batchDebounceMs = 500,
  onSuccess,
  onError
}: UseBatchInlineEditOptions) => {
  // Initialize field states
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>(() => {
    const initial: Record<string, FieldState> = {};
    fields.forEach(field => {
      initial[field.fieldName] = {
        value: field.initialValue,
        originalValue: field.initialValue,
        hasChanges: false
      };
    });
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingChangesRef = useRef<Set<string>>(new Set());
  const isUnmountedRef = useRef(false);

  const { toast } = useToast();

  // Sync with external field changes
  useEffect(() => {
    setFieldStates(prev => {
      const updated = { ...prev };
      let hasUpdates = false;

      fields.forEach(field => {
        const currentState = prev[field.fieldName];
        if (currentState && field.initialValue !== currentState.originalValue) {
          updated[field.fieldName] = {
            value: field.initialValue,
            originalValue: field.initialValue,
            hasChanges: false
          };
          hasUpdates = true;
        }
      });

      return hasUpdates ? updated : prev;
    });
  }, [fields]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  // Batch save function
  const executeBatchSave = useCallback(async () => {
    if (pendingChangesRef.current.size === 0 || isUnmountedRef.current) {
      return;
    }

    const fieldsToSave = Array.from(pendingChangesRef.current);
    const updates: Record<string, string> = {};
    
    // Prepare batch update
    fieldsToSave.forEach(fieldName => {
      const fieldState = fieldStates[fieldName];
      if (fieldState && fieldState.hasChanges) {
        updates[fieldName] = fieldState.value;
      }
    });

    if (Object.keys(updates).length === 0) {
      pendingChangesRef.current.clear();
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from(tableName as any)
        .update(updates)
        .eq('id', recordId);

      if (updateError) {
        throw updateError;
      }

      if (isUnmountedRef.current) return;

      // Update original values for successfully saved fields
      setFieldStates(prev => {
        const updated = { ...prev };
        fieldsToSave.forEach(fieldName => {
          if (updated[fieldName]) {
            updated[fieldName] = {
              ...updated[fieldName],
              originalValue: updated[fieldName].value,
              hasChanges: false
            };
          }
        });
        return updated;
      });

      setSaveStatus('saved');
      onSuccess?.(updates);

      // Auto-clear saved status
      setTimeout(() => {
        if (!isUnmountedRef.current) {
          setSaveStatus('idle');
        }
      }, 2000);

    } catch (err) {
      if (isUnmountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Batch save failed';
      setError(errorMessage);
      setSaveStatus('error');
      onError?.(errorMessage);

      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Revert failed changes
      setFieldStates(prev => {
        const updated = { ...prev };
        fieldsToSave.forEach(fieldName => {
          if (updated[fieldName]) {
            updated[fieldName] = {
              ...updated[fieldName],
              value: updated[fieldName].originalValue,
              hasChanges: false
            };
          }
        });
        return updated;
      });
    } finally {
      if (!isUnmountedRef.current) {
        setIsSaving(false);
      }
      pendingChangesRef.current.clear();
    }
  }, [tableName, recordId, fieldStates, onSuccess, onError, toast]);

  // Update a specific field
  const updateField = useCallback((fieldName: string, newValue: string) => {
    setFieldStates(prev => {
      const fieldState = prev[fieldName];
      if (!fieldState) return prev;

      const hasChanges = newValue !== fieldState.originalValue;
      
      const updated = {
        ...prev,
        [fieldName]: {
          ...fieldState,
          value: newValue,
          hasChanges
        }
      };

      return updated;
    });

    // Add to pending changes if it has changes
    const fieldState = fieldStates[fieldName];
    if (fieldState && newValue !== fieldState.originalValue) {
      pendingChangesRef.current.add(fieldName);
    } else {
      pendingChangesRef.current.delete(fieldName);
    }

    // Debounced batch save
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      executeBatchSave();
    }, batchDebounceMs);
  }, [fieldStates, batchDebounceMs, executeBatchSave]);

  // Save immediately
  const saveNow = useCallback(async () => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    return executeBatchSave();
  }, [executeBatchSave]);

  // Revert all changes
  const revertAll = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    setFieldStates(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(fieldName => {
        updated[fieldName] = {
          ...updated[fieldName],
          value: updated[fieldName].originalValue,
          hasChanges: false
        };
      });
      return updated;
    });

    pendingChangesRef.current.clear();
    setSaveStatus('idle');
    setError(null);
  }, []);

  // Revert specific field
  const revertField = useCallback((fieldName: string) => {
    setFieldStates(prev => {
      const fieldState = prev[fieldName];
      if (!fieldState) return prev;

      return {
        ...prev,
        [fieldName]: {
          ...fieldState,
          value: fieldState.originalValue,
          hasChanges: false
        }
      };
    });

    pendingChangesRef.current.delete(fieldName);
  }, []);

  // Check if any fields have changes
  const hasAnyChanges = Object.values(fieldStates).some(state => state.hasChanges);

  // Get field value
  const getFieldValue = useCallback((fieldName: string) => {
    return fieldStates[fieldName]?.value || '';
  }, [fieldStates]);

  // Check if specific field has changes
  const fieldHasChanges = useCallback((fieldName: string) => {
    return fieldStates[fieldName]?.hasChanges || false;
  }, [fieldStates]);

  return {
    // Field operations
    updateField,
    getFieldValue,
    fieldHasChanges,
    revertField,
    
    // Batch operations
    saveNow,
    revertAll,
    
    // State
    isSaving,
    saveStatus,
    error,
    hasAnyChanges,
    fieldStates,
  };
};