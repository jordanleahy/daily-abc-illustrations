import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAutoSaveOptions {
  onSave: (values: Record<string, any>) => Promise<void>;
  delay?: number;
}

export const useAutoSave = ({ onSave, delay = 500 }: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const originalValuesRef = useRef<Record<string, any>>({});
  const currentValuesRef = useRef<Record<string, any>>({});

  const setOriginalValues = useCallback((values: Record<string, any>) => {
    originalValuesRef.current = { ...values };
    currentValuesRef.current = { ...values };
  }, []);

  const hasChanges = useCallback(() => {
    return JSON.stringify(originalValuesRef.current) !== JSON.stringify(currentValuesRef.current);
  }, []);

  const autoSave = useCallback((values: Record<string, any>) => {
    // Update current values
    currentValuesRef.current = { ...values };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only save if there are actual changes
    if (!hasChanges()) {
      return;
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(async () => {
      try {
        await onSave(values);
        // Update original values after successful save
        originalValuesRef.current = { ...values };
      } catch (error) {
        // Silent error handling - just log to console
        console.error('Auto-save failed:', error);
        // Revert to original values silently
        currentValuesRef.current = { ...originalValuesRef.current };
      }
    }, delay);
  }, [onSave, delay, hasChanges]);

  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Revert to original values
    currentValuesRef.current = { ...originalValuesRef.current };
  }, []);

  const forceRevert = useCallback(() => {
    cancelAutoSave();
    return { ...originalValuesRef.current };
  }, [cancelAutoSave]);

  return {
    autoSave,
    cancelAutoSave,
    forceRevert,
    setOriginalValues,
    hasChanges
  };
};