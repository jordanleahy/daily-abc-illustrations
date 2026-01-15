import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateTTSCacheKey, getTTSFromCache, cacheTTSAudio } from '@/utils/ttsCaching';

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

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const { voiceId, onWordChange } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [wordTimings, setWordTimings] = useState<WordTiming[]>([]);
  const [isCacheHit, setIsCacheHit] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wordTimingsRef = useRef<WordTiming[]>([]);
  
  // Refs for instant replay of same audio
  const lastCacheKeyRef = useRef<string | null>(null);
  const cachedAudioRef = useRef<HTMLAudioElement | null>(null);
  const cachedObjectUrlRef = useRef<string | null>(null);

  // Cleanup function - preserves cached audio for instant replay
  const cleanup = useCallback((preserveCache: boolean = true) => {
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
    
    // Only clear cached audio when explicitly requested (e.g., unmount)
    if (!preserveCache) {
      if (cachedObjectUrlRef.current) {
        URL.revokeObjectURL(cachedObjectUrlRef.current);
        cachedObjectUrlRef.current = null;
      }
      cachedAudioRef.current = null;
      lastCacheKeyRef.current = null;
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

  // Helper to play audio blob and cache for instant replay
  const playAudioBlob = useCallback(async (
    audioBlob: Blob,
    timings: WordTiming[],
    withSync: boolean,
    cacheKey: string
  ) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    objectUrlRef.current = audioUrl;
    
    wordTimingsRef.current = timings;
    setWordTimings(timings);

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    // Cache for instant replay
    lastCacheKeyRef.current = cacheKey;
    cachedAudioRef.current = audio;
    // Keep a separate reference to the URL for the cached audio
    if (cachedObjectUrlRef.current && cachedObjectUrlRef.current !== audioUrl) {
      URL.revokeObjectURL(cachedObjectUrlRef.current);
    }
    cachedObjectUrlRef.current = audioUrl;

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
    
    if (withSync && timings.length > 0) {
      syncWords(audio);
    }
    
    await audio.play();
  }, [syncWords]);

  // Speak text with cache-first strategy
  const speak = useCallback(async (text: string, withSync: boolean = true) => {
    if (!text) return;
    
    const effectiveVoiceId = voiceId || 'default';
    const cacheKey = generateTTSCacheKey(text, effectiveVoiceId);
    
    // 0. Instant replay - same audio element, no cache lookup needed
    if (lastCacheKeyRef.current === cacheKey && cachedAudioRef.current) {
      console.log('[TTS] Instant replay - same audio:', cacheKey);
      
      // Stop animation frame if running
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setIsCacheHit(true);
      setIsLoading(false);
      setIsPlaying(true);
      setCurrentWordIndex(-1);
      
      cachedAudioRef.current.currentTime = 0;
      
      // Restart word sync if needed
      if (withSync && wordTimingsRef.current.length > 0) {
        syncWords(cachedAudioRef.current);
      }
      
      try {
        await cachedAudioRef.current.play();
      } catch (err) {
        console.error('[TTS] Replay failed:', err);
        setIsPlaying(false);
      }
      return;
    }
    
    // Stop any current playback (but preserve cached audio for potential replay)
    cleanup(true);
    setError(null);
    setIsLoading(true);
    setWordTimings([]);
    setIsCacheHit(false);

    try {
      // 1. Check cache first (memory → Service Worker)
      const cached = await getTTSFromCache(cacheKey);
      
      if (cached && cached.audioBlob) {
        console.log('[TTS] Cache hit - instant playback:', cacheKey);
        setIsCacheHit(true);
        wordTimingsRef.current = cached.wordTimings || [];
        await playAudioBlob(cached.audioBlob, cached.wordTimings || [], withSync, cacheKey);
        return;
      }
      
      // 2. Cache miss - fetch from API
      console.log('[TTS] Cache miss - fetching from ElevenLabs:', cacheKey);
      
      const response = await fetch(
        'https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/elevenlabs-tts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI',
          },
          body: JSON.stringify({ text, voiceId, withTimestamps: withSync }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      let audioBlob: Blob;
      let timings: WordTiming[] = [];
      
      if (withSync) {
        // Parse JSON response with timestamps
        const data = await response.json();
        
        // Convert base64 to blob
        const binaryString = atob(data.audio_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        timings = data.wordTimings || [];
        
        console.log('[TTS] Word timings received:', timings.length);
      } else {
        // Regular audio blob response
        audioBlob = await response.blob();
      }
      
      // 3. Cache the response for future use (permanent)
      cacheTTSAudio(cacheKey, audioBlob, timings, text, effectiveVoiceId)
        .then((success) => {
          if (success) {
            console.log('[TTS] Audio cached for future use:', cacheKey);
          }
        })
        .catch((err) => {
          console.warn('[TTS] Failed to cache audio:', err);
        });
      
      // 4. Play the audio
      await playAudioBlob(audioBlob, timings, withSync, cacheKey);
      
    } catch (err) {
      console.error('TTS error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, [voiceId, cleanup, playAudioBlob, syncWords]);

  // Full cleanup on unmount (including cached audio)
  useEffect(() => {
    return () => cleanup(false);
  }, [cleanup]);

  return { speak, stop, isLoading, isPlaying, error, currentWordIndex, wordTimings, isCacheHit };
}
