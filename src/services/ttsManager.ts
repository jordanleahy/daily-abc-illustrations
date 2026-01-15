import { generateTTSCacheKey, getTTSFromCache, cacheTTSAudio } from '@/utils/ttsCaching';

interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface PlaybackCallbacks {
  onWordChange?: (index: number, word: string) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (error: string) => void;
  onTimingsReady?: (timings: WordTiming[]) => void;
  onCacheHit?: (hit: boolean) => void;
}

/**
 * Imperative TTS Manager - handles audio playback outside React's render cycle.
 * This eliminates race conditions between React state updates and audio timing.
 */
class TTSManager {
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private animationFrame: number | null = null;
  private wordTimings: WordTiming[] = [];
  private callbacks: PlaybackCallbacks = {};
  private currentWordIndex: number = -1;

  /**
   * Play text with optional word synchronization
   */
  // Default to Lily voice (pFZP5JQG7iQjIQuC4Bku) if no voiceId provided
  private static readonly DEFAULT_VOICE_ID = 'pFZP5JQG7iQjIQuC4Bku';

  async speak(
    text: string,
    voiceId: string = TTSManager.DEFAULT_VOICE_ID,
    withSync: boolean = true,
    callbacks: PlaybackCallbacks = {}
  ): Promise<void> {
    if (!text) return;

    // Store callbacks for this playback session
    this.callbacks = callbacks;
    
    // Cleanup any existing playback
    this.cleanup();
    
    callbacks.onLoadingChange?.(true);
    callbacks.onCacheHit?.(false);

    const cacheKey = generateTTSCacheKey(text, voiceId);

    try {
      // 1. Check cache first
      const cached = await getTTSFromCache(cacheKey);
      
      if (cached?.audioBlob) {
        console.log('[TTSManager] Cache hit:', cacheKey);
        callbacks.onCacheHit?.(true);
        await this.playBlob(cached.audioBlob, cached.wordTimings || [], withSync);
        return;
      }

      // 2. Cache miss - fetch from API
      console.log('[TTSManager] Cache miss - fetching:', cacheKey);
      
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
        const data = await response.json();
        const binaryString = atob(data.audio_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        timings = data.wordTimings || [];
        console.log('[TTSManager] Word timings received:', timings.length);
      } else {
        audioBlob = await response.blob();
      }

      // 3. Cache for future use
      cacheTTSAudio(cacheKey, audioBlob, timings, text, voiceId)
        .then(success => success && console.log('[TTSManager] Cached:', cacheKey))
        .catch(err => console.warn('[TTSManager] Cache failed:', err));

      // 4. Play
      await this.playBlob(audioBlob, timings, withSync);

    } catch (err) {
      console.error('[TTSManager] Error:', err);
      callbacks.onError?.(err instanceof Error ? err.message : 'TTS failed');
      callbacks.onLoadingChange?.(false);
      callbacks.onPlayingChange?.(false);
    }
  }

  /**
   * Play an audio blob with word synchronization
   */
  private async playBlob(blob: Blob, timings: WordTiming[], withSync: boolean): Promise<void> {
    // Create fresh audio element and object URL
    this.objectUrl = URL.createObjectURL(blob);
    this.audio = new Audio(this.objectUrl);
    this.wordTimings = timings;
    this.currentWordIndex = -1;

    // Notify timings are ready
    this.callbacks.onTimingsReady?.(timings);

    // Setup event handlers
    this.audio.onended = () => {
      this.callbacks.onPlayingChange?.(false);
      this.callbacks.onWordChange?.(-1, '');
      this.stopSyncLoop();
    };

    this.audio.onerror = () => {
      this.callbacks.onError?.('Audio playback failed');
      this.callbacks.onPlayingChange?.(false);
      this.stopSyncLoop();
    };

    // Start playback
    this.callbacks.onLoadingChange?.(false);
    this.callbacks.onPlayingChange?.(true);

    await this.audio.play();

    // Start sync loop AFTER play() resolves
    if (withSync && timings.length > 0) {
      this.startSyncLoop();
    }
  }

  /**
   * Word synchronization loop using requestAnimationFrame
   */
  private startSyncLoop(): void {
    const sync = () => {
      if (!this.audio || this.audio.paused || this.audio.ended) {
        return;
      }

      const currentTime = this.audio.currentTime;
      let newIndex = -1;

      for (let i = 0; i < this.wordTimings.length; i++) {
        const timing = this.wordTimings[i];
        if (currentTime >= timing.startTime && currentTime <= timing.endTime) {
          newIndex = i;
          break;
        }
        // Between words - show previous
        if (currentTime > timing.endTime && 
            (i === this.wordTimings.length - 1 || currentTime < this.wordTimings[i + 1].startTime)) {
          newIndex = i;
          break;
        }
      }

      if (newIndex !== this.currentWordIndex && newIndex >= 0) {
        this.currentWordIndex = newIndex;
        const word = this.wordTimings[newIndex]?.word || '';
        this.callbacks.onWordChange?.(newIndex, word);
      }

      this.animationFrame = requestAnimationFrame(sync);
    };

    this.animationFrame = requestAnimationFrame(sync);
  }

  private stopSyncLoop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Stop current playback and cleanup resources
   */
  stop(): void {
    this.cleanup();
    this.callbacks.onPlayingChange?.(false);
    this.callbacks.onWordChange?.(-1, '');
  }

  private cleanup(): void {
    this.stopSyncLoop();
    
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    
    this.wordTimings = [];
    this.currentWordIndex = -1;
  }

  /**
   * Cleanup on app unmount
   */
  destroy(): void {
    this.cleanup();
    this.callbacks = {};
  }
}

// Singleton instance
export const ttsManager = new TTSManager();
