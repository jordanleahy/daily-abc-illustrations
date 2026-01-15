import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const { voiceId, onWordChange } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [wordTimings, setWordTimings] = useState<WordTiming[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wordTimingsRef = useRef<WordTiming[]>([]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsPlaying(false);
    setCurrentWordIndex(-1);
    wordTimingsRef.current = [];
  }, []);

  // Stop playback
  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Word sync animation loop
  const syncWords = useCallback((audio: HTMLAudioElement) => {
    const updateWordIndex = () => {
      if (!audio || audio.paused || audio.ended) {
        return;
      }
      
      const currentTime = audio.currentTime;
      const timings = wordTimingsRef.current;
      
      // Find the word that should be highlighted at current time
      let newIndex = -1;
      for (let i = 0; i < timings.length; i++) {
        if (currentTime >= timings[i].startTime && currentTime <= timings[i].endTime) {
          newIndex = i;
          break;
        }
        // If we're between words, show the previous word
        if (currentTime > timings[i].endTime && (i === timings.length - 1 || currentTime < timings[i + 1].startTime)) {
          newIndex = i;
          break;
        }
      }
      
      setCurrentWordIndex(prev => {
        if (prev !== newIndex && newIndex >= 0) {
          const word = timings[newIndex]?.word || '';
          onWordChange?.(newIndex, word);
        }
        return newIndex;
      });
      
      animationFrameRef.current = requestAnimationFrame(updateWordIndex);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateWordIndex);
  }, [onWordChange]);

  // Speak text
  const speak = useCallback(async (text: string, withSync: boolean = true) => {
    if (!text) return;
    
    // Stop any current playback
    cleanup();
    setError(null);
    setIsLoading(true);
    setWordTimings([]);

    try {
      // Get the Supabase URL from the client
      const supabaseUrl = (supabase as any).supabaseUrl;
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text, voiceId, withTimestamps: withSync }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      let audioUrl: string;
      
      if (withSync) {
        // Parse JSON response with timestamps
        const data = await response.json();
        
        // Convert base64 to blob
        const binaryString = atob(data.audio_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(audioBlob);
        
        // Store word timings
        wordTimingsRef.current = data.wordTimings || [];
        setWordTimings(data.wordTimings || []);
        
        console.log('[TTS] Word timings received:', data.wordTimings?.length || 0);
      } else {
        // Regular audio blob response
        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
      }
      
      objectUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentWordIndex(-1);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };

      audio.onerror = () => {
        setError('Failed to play audio');
        setIsPlaying(false);
        setCurrentWordIndex(-1);
      };

      setIsLoading(false);
      setIsPlaying(true);
      
      // Start word sync if we have timings
      if (withSync && wordTimingsRef.current.length > 0) {
        syncWords(audio);
      }
      
      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [voiceId, cleanup, syncWords]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { speak, stop, isLoading, isPlaying, error, currentWordIndex, wordTimings };
}
