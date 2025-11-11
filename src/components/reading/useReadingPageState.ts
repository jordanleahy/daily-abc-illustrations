import { useState, useCallback, useRef } from 'react';
import { useReadingPreferences } from '@/hooks/useReadingPreferences';
import type { CarouselApi } from '@/components/ui/carousel';

export function useReadingPageState() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordStatuses, setWordStatuses] = useState<Record<number, 'difficult' | 'understood'>>({});
  const [isEditingText, setIsEditingText] = useState(false);
  const carouselApiRef = useRef<CarouselApi | null>(null);
  
  // Use database-backed preferences for cross-device sync
  const { hiddenOverlayPages, toggleOverlay: toggleOverlayDB, isLoading: isPreferencesLoading } = useReadingPreferences();


  const setCarouselApi = useCallback((api: CarouselApi) => {
    carouselApiRef.current = api;
  }, []);

  const handleNavigateWord = useCallback((direction: 'prev' | 'next', totalWords: number) => {
    const api = carouselApiRef.current;
    if (!api) return;

    if (direction === 'prev') {
      api.scrollPrev();
    } else {
      api.scrollNext();
    }
  }, []);

  const handleMarkDifficult = useCallback((totalWords: number) => {
    setWordStatuses(prev => ({ ...prev, [currentWordIndex]: 'difficult' }));
    if (currentWordIndex < totalWords - 1) {
      const api = carouselApiRef.current;
      if (api) {
        api.scrollNext();
      }
    }
  }, [currentWordIndex]);

  const handleMarkUnderstood = useCallback((totalWords: number) => {
    setWordStatuses(prev => ({ ...prev, [currentWordIndex]: 'understood' }));
    if (currentWordIndex < totalWords - 1) {
      const api = carouselApiRef.current;
      if (api) {
        api.scrollNext();
      }
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
    setCarouselApi,
    handleNavigateWord,
    handleMarkDifficult,
    handleMarkUnderstood,
    resetState,
    toggleOverlayVisibility,
    setCurrentWordIndex,
  };
}
