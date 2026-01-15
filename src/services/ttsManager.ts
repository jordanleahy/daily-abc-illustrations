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
}

/**
 * Minimal imperative TTS Manager - no caching, just fetch and play.
 * Handles audio playback outside React's render cycle.
 */
class TTSManager {
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private animationFrame: number | null = null;
  private wordTimings: WordTiming[] = [];
  private callbacks: PlaybackCallbacks = {};
  private currentWordIndex: number = -1;

  private static readonly DEFAULT_VOICE_ID = 'pFZP5JQG7iQjIQuC4Bku';

  /**
   * Play text with word synchronization
   */
  async speak(
    text: string,
    voiceId?: string,
    withSync: boolean = true,
    callbacks: PlaybackCallbacks = {}
  ): Promise<void> {
    if (!text) return;

    const effectiveVoiceId = voiceId || TTSManager.DEFAULT_VOICE_ID;
    
    // Store callbacks for this playback session
    this.callbacks = callbacks;
    
    // Cleanup any existing playback
    this.cleanup();
    
    callbacks.onLoadingChange?.(true);

    try {
      console.log('[TTSManager] Fetching audio for:', text.substring(0, 50) + '...');
      
      const response = await fetch(
        'https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/elevenlabs-tts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI',
          },
          body: JSON.stringify({ 
            text, 
            voiceId: effectiveVoiceId, 
            withTimestamps: withSync 
          }),
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
        console.log('[TTSManager] Received', timings.length, 'word timings');
      } else {
        audioBlob = await response.blob();
      }

      // Play the audio
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
      console.log('[TTSManager] Audio ended');
      this.callbacks.onPlayingChange?.(false);
      this.callbacks.onWordChange?.(-1, '');
      this.stopSyncLoop();
    };

    this.audio.onerror = (e) => {
      console.error('[TTSManager] Audio error:', e);
      this.callbacks.onError?.('Audio playback failed');
      this.callbacks.onPlayingChange?.(false);
      this.stopSyncLoop();
    };

    // Start playback
    this.callbacks.onLoadingChange?.(false);
    this.callbacks.onPlayingChange?.(true);

    console.log('[TTSManager] Starting playback, withSync:', withSync, 'timings:', timings.length);
    
    await this.audio.play();

    // Start sync loop AFTER play() resolves
    if (withSync && timings.length > 0) {
      console.log('[TTSManager] Starting sync loop');
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
}

// Singleton instance
export const ttsManager = new TTSManager();
