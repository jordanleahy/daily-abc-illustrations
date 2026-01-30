import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/utils/clipboardHelpers';

interface CopyState {
  [key: string]: boolean;
}

/**
 * Hook for managing clipboard copy operations with visual feedback
 * Handles event propagation to prevent drawer/modal closure on copy
 */
export function useCopyWithFeedback() {
  const { toast } = useToast();
  const [copiedStates, setCopiedStates] = useState<CopyState>({});

  const handleCopy = useCallback(async (
    e: React.MouseEvent,
    text: string,
    key: string,
    label?: string
  ) => {
    // Prevent event bubbling that could close drawers/modals
    e.preventDefault();
    e.stopPropagation();

    try {
      await copyToClipboard(text);
      
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
      
      const displayLabel = label || key.charAt(0).toUpperCase() + key.slice(1);
      toast({ title: `${displayLabel} copied!` });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  }, [toast]);

  const isCopied = useCallback((key: string) => {
    return copiedStates[key] || false;
  }, [copiedStates]);

  return { handleCopy, isCopied };
}
