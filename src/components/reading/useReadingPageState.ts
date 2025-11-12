import { useState, useCallback } from 'react';
import { useReadingPreferences } from '@/hooks/useReadingPreferences';

export function useReadingPageState() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordStatuses, setWordStatuses] = useState<Record<number, 'difficult' | 'understood'>>({});
  const [isEditingText, setIsEditingText] = useState(false);
  
  // Use database-backed preferences for cross-device sync
  const { hiddenOverlayPages, toggleOverlay: toggleOverlayDB, isLoading: isPreferencesLoading } = useReadingPreferences();

  const handleNavigateWord = useCallback((direction: 'prev' | 'next', totalWords: number) => {
    setCurrentWordIndex(prev => {
      if (direction === 'prev') {
        return prev > 0 ? prev - 1 : totalWords - 1; // Loop to end
      } else {
        return prev < totalWords - 1 ? prev + 1 : 0; // Loop to start
      }
    });
  }, []);

  const handleMarkDifficult = useCallback((totalWords: number) => {
    setWordStatuses(prev => ({ ...prev, [currentWordIndex]: 'difficult' }));
    // Auto-advance to next word
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  }, [currentWordIndex]);

  const handleMarkUnderstood = useCallback((totalWords: number) => {
    setWordStatuses(prev => ({ ...prev, [currentWordIndex]: 'understood' }));
    // Auto-advance to next word
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  }, [currentWordIndex]);

  const resetState = useCallback(() => {
    setCurrentWordIndex(0);
    setWordStatuses({});
  }, []);

  const toggleOverlayVisibility = useCallback((pageId: string) => {
    toggleOverlayDB(pageId);
  }, [toggleOverlayDB]);

  return {
    currentWordIndex,
    wordStatuses,
    isEditingText,
    hiddenOverlayPages,
    isPreferencesLoading,
    setIsEditingText,
    handleNavigateWord,
    handleMarkDifficult,
    handleMarkUnderstood,
    resetState,
    toggleOverlayVisibility,
    setCurrentWordIndex,
  };
}
