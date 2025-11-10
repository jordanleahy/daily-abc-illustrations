import { useState, useCallback } from 'react';
import { useReadingPreferences } from '@/hooks/useReadingPreferences';

export function useReadingPageState() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isWordEnlarged, setIsWordEnlarged] = useState(false);
  const [wordStatuses, setWordStatuses] = useState<Record<number, 'difficult' | 'understood'>>({});
  const [isEditingText, setIsEditingText] = useState(false);
  
  // Use database-backed preferences for cross-device sync
  const { hiddenOverlayPages, toggleOverlay: toggleOverlayDB } = useReadingPreferences();

  const handleToggleEnlarge = useCallback(() => {
    setIsWordEnlarged(prev => !prev);
  }, []);

  const handleNavigateWord = useCallback((direction: 'prev' | 'next', totalWords: number) => {
    setCurrentWordIndex(prev => {
      if (direction === 'prev') {
        return Math.max(0, prev - 1);
      } else {
        return Math.min(totalWords - 1, prev + 1);
      }
    });
  }, []);

  const handleMarkDifficult = useCallback((totalWords: number) => {
    setWordStatuses(prev => ({ ...prev, [currentWordIndex]: 'difficult' }));
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  }, [currentWordIndex]);

  const handleMarkUnderstood = useCallback((totalWords: number) => {
    setWordStatuses(prev => ({ ...prev, [currentWordIndex]: 'understood' }));
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  }, [currentWordIndex]);

  const resetState = useCallback(() => {
    setCurrentWordIndex(0);
    setIsWordEnlarged(false);
    setWordStatuses({});
  }, []);

  const toggleOverlayVisibility = useCallback((pageId: string) => {
    toggleOverlayDB(pageId);
  }, [toggleOverlayDB]);

  return {
    currentWordIndex,
    isWordEnlarged,
    wordStatuses,
    isEditingText,
    hiddenOverlayPages,
    setIsEditingText,
    handleToggleEnlarge,
    handleNavigateWord,
    handleMarkDifficult,
    handleMarkUnderstood,
    resetState,
    toggleOverlayVisibility,
  };
}
