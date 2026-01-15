/**
 * TTS Request Queue - Global rate limiter for ElevenLabs API
 * Prevents 429 errors by limiting concurrent requests to 2
 */

type QueuedRequest<T> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

class TTSRequestQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private activeCount = 0;
  private readonly maxConcurrent = 2; // ElevenLabs allows 3, we use 2 for safety
  private readonly minDelayMs = 200; // Minimum delay between requests
  private lastRequestTime = 0;
  
  // Global tracking of prefetched texts to avoid duplicate requests
  private prefetchedTexts = new Set<string>();

  async enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ execute, resolve: resolve as (value: unknown) => void, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.activeCount++;

    // Enforce minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelayMs) {
      await new Promise(r => setTimeout(r, this.minDelayMs - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.activeCount--;
      // Process next item after a small delay
      setTimeout(() => this.processQueue(), 50);
    }
  }

  /**
   * Mark a text as prefetched to avoid duplicate requests across components
   */
  markPrefetched(cacheKey: string): void {
    this.prefetchedTexts.add(cacheKey);
  }

  /**
   * Check if a text has been prefetched (or is currently being prefetched)
   */
  isPrefetched(cacheKey: string): boolean {
    return this.prefetchedTexts.has(cacheKey);
  }

  /**
   * Get current queue status for debugging
   */
  getStatus(): { queueLength: number; activeCount: number; prefetchedCount: number } {
    return {
      queueLength: this.queue.length,
      activeCount: this.activeCount,
      prefetchedCount: this.prefetchedTexts.size,
    };
  }

  /**
   * Clear the prefetched tracking (useful for cache clear)
   */
  clearPrefetchedTracking(): void {
    this.prefetchedTexts.clear();
  }
}

// Singleton instance
export const ttsRequestQueue = new TTSRequestQueue();
