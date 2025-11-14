import { useState, useCallback } from 'react';
import { useReadingPreferences } from '@/hooks/useReadingPreferences';
import { useWordLearningProgress } from '@/hooks/useWordLearningProgress';
import { WordMetadata } from '@/utils/wordParser';

interface ReadingPageStateConfig {
  kidProfileId?: string;
  bookId?: string;
  pageId?: string;
  pageTitle?: string;
  words?: WordMetadata[];
}

export function useReadingPageState(config?: ReadingPageStateConfig) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordStatuses, setWordStatuses] = useState<Record<number, 'difficult' | 'understood'>>({});
  const [isEditingText, setIsEditingText] = useState(false);
  const [isReadMode, setIsReadMode] = useState(false);
  const [hasReachedLastWord, setHasReachedLastWord] = useState(false);
  
  // Use database-backed preferences for cross-device sync
  const { hiddenOverlayPages, toggleOverlay: toggleOverlayDB, isLoading: isPreferencesLoading } = useReadingPreferences();
  
  // Word learning progress tracking
  const { saveWordMark } = useWordLearningProgress(config?.kidProfileId);

  const handleNavigateWord = useCallback((direction: 'prev' | 'next', totalWords: number) => {
    setCurrentWordIndex(prev => {
      const newIndex = direction === 'prev' 
        ? (prev > 0 ? prev - 1 : totalWords - 1)
        : (prev < totalWords - 1 ? prev + 1 : 0);
      
      // Track if user has reached the last word
      if (newIndex === totalWords - 1) {
        setHasReachedLastWord(true);
      }
      
      return newIndex;
    });
  }, []);

  const handleMarkDifficult = useCallback((totalWords: number) => {
    const currentWord = config?.words?.[currentWordIndex];
    
    // Save to local state for immediate UI feedback
    setWordStatuses(prev => ({ ...prev, [currentWordIndex]: 'difficult' }));
    
    // Save to database for tracking and recommendations (if config provided)
    if (config?.kidProfileId && config?.bookId && config?.pageId && currentWord) {
      saveWordMark.mutate({
        kidProfileId: config.kidProfileId,
        bookId: config.bookId,
        pageId: config.pageId,
        wordMetadata: currentWord,
        sentenceContext: config.pageTitle || '',
        status: 'difficult',
      });
    }
    
    // Auto-advance to next word
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  }, [currentWordIndex, config, saveWordMark]);

  const handleMarkUnderstood = useCallback((totalWords: number) => {
    const currentWord = config?.words?.[currentWordIndex];
    
    // Save to local state for immediate UI feedback
    setWordStatuses(prev => ({ ...prev, [currentWordIndex]: 'understood' }));
    
    // Save to database for tracking (if config provided)
    if (config?.kidProfileId && config?.bookId && config?.pageId && currentWord) {
      saveWordMark.mutate({
        kidProfileId: config.kidProfileId,
        bookId: config.bookId,
        pageId: config.pageId,
        wordMetadata: currentWord,
        sentenceContext: config.pageTitle || '',
        status: 'understood',
      });
    }
    
    // Auto-advance to next word
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  }, [currentWordIndex, config, saveWordMark]);

  const resetState = useCallback(() => {
    setCurrentWordIndex(0);
    setWordStatuses({});
    setIsReadMode(false);
    setHasReachedLastWord(false);
  }, []);

  const toggleOverlayVisibility = useCallback((pageId: string) => {
    toggleOverlayDB(pageId);
  }, [toggleOverlayDB]);

  const toggleReadMode = useCallback(() => {
    setIsReadMode(prev => !prev);
  }, []);

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
    isReadMode,
    toggleReadMode,
    hasReachedLastWord,
  };
}
