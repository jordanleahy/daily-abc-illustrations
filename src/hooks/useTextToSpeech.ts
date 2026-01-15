import { useState, useCallback, useEffect, useRef } from 'react';
import { ttsManager } from '@/services/ttsManager';

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface UseTextToSpeechOptions {
  voiceId?: string;
  onWordChange?: (wordIndex: number, word: string) => void;
}

interface UseTextToSpeechReturn {
  speak: (text: string, withSync?: boolean) => Promise<void>;
  stop: () => void;
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  currentWordIndex: number;
  wordTimings: WordTiming[];
  isCacheHit: boolean;
}

/**
 * React hook wrapper around the imperative TTSManager.
 * Bridges the manager's callbacks to React state.
 */
export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const { voiceId, onWordChange } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [wordTimings, setWordTimings] = useState<WordTiming[]>([]);
  const [isCacheHit, setIsCacheHit] = useState(false);
  
  // Store onWordChange in ref to avoid stale closures
  const onWordChangeRef = useRef(onWordChange);
  onWordChangeRef.current = onWordChange;

  const speak = useCallback(async (text: string, withSync: boolean = true) => {
    setError(null);
    setCurrentWordIndex(-1);
    setWordTimings([]);
    
    await ttsManager.speak(text, voiceId || 'default', withSync, {
      onWordChange: (index, word) => {
        setCurrentWordIndex(index);
        onWordChangeRef.current?.(index, word);
      },
      onPlayingChange: setIsPlaying,
      onLoadingChange: setIsLoading,
      onError: setError,
      onTimingsReady: setWordTimings,
      onCacheHit: setIsCacheHit,
    });
  }, [voiceId]);

  const stop = useCallback(() => {
    ttsManager.stop();
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ttsManager.stop();
    };
  }, []);

  return { 
    speak, 
    stop, 
    isLoading, 
    isPlaying, 
    error, 
    currentWordIndex, 
    wordTimings, 
    isCacheHit 
  };
}
