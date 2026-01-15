/**
 * TTS Audio Prefetch Hook
 * Predictively prefetches TTS audio for upcoming pages during idle time
 */

import { useEffect, useRef, useCallback } from 'react';
import { prefetchTTSAudio } from '@/utils/ttsCaching';
import type { Page } from '@/types/book';

interface UseTTSPrefetchOptions {
  /** Number of pages ahead to prefetch (default: 3) */
  prefetchCount?: number;
  /** Delay between prefetch requests in ms (default: 500) */
  delayBetweenRequests?: number;
  /** Voice ID for TTS (optional - uses server default if not provided) */
  voiceId?: string;
  /** Enable/disable prefetching (default: true) */
  enabled?: boolean;
}

/**
 * Hook to prefetch TTS audio for upcoming pages
 * Uses predictive strategy: prefetch next N pages during browser idle time
 * 
 * @param pages - Array of all pages in the book
 * @param currentPageIndex - Current page being viewed
 * @param options - Configuration options
 */
export function useTTSPrefetch(
  pages: Page[],
  currentPageIndex: number,
  options: UseTTSPrefetchOptions = {}
) {
  const {
    prefetchCount = 3,
    delayBetweenRequests = 500,
    voiceId,
    enabled = true,
  } = options;

  // Track which page IDs we've already prefetched
  const prefetchedRef = useRef(new Set<string>());
  // Track active prefetch operations
  const abortRef = useRef(false);

  const prefetchPages = useCallback(async (pagesToPrefetch: Page[]) => {
    abortRef.current = false;
    
    for (const page of pagesToPrefetch) {
      // Stop if disabled or tab hidden
      if (abortRef.current || document.hidden) {
        console.log('[TTS Prefetch] Stopped - tab hidden or aborted');
        break;
      }
      
      // Skip pages without titles or already prefetched
      if (!page.title || prefetchedRef.current.has(page.id)) {
        continue;
      }
      
      // Prefetch the audio
      const success = await prefetchTTSAudio(page.title, voiceId);
      
      if (success) {
        prefetchedRef.current.add(page.id);
      }
      
      // Small delay between requests to avoid API rate limits
      if (delayBetweenRequests > 0) {
        await new Promise(r => setTimeout(r, delayBetweenRequests));
      }
    }
  }, [voiceId, delayBetweenRequests]);

  useEffect(() => {
    if (!enabled || pages.length === 0) return;
    
    // Determine which pages to prefetch (next N pages)
    const startIndex = currentPageIndex + 1;
    const endIndex = Math.min(startIndex + prefetchCount, pages.length);
    const pagesToPrefetch = pages
      .slice(startIndex, endIndex)
      .filter(page => page.title && !prefetchedRef.current.has(page.id));
    
    if (pagesToPrefetch.length === 0) {
      console.log('[TTS Prefetch] No pages to prefetch');
      return;
    }
    
    console.log('[TTS Prefetch] Scheduling prefetch for', pagesToPrefetch.length, 'pages');
    
    // Use requestIdleCallback for non-blocking prefetch
    // Fallback to setTimeout for browsers that don't support it
    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    
    const startPrefetch = () => {
      prefetchPages(pagesToPrefetch);
    };
    
    if ('requestIdleCallback' in window) {
      idleHandle = requestIdleCallback(startPrefetch, { timeout: 10000 });
    } else {
      // Fallback: delay 1 second then start
      timeoutHandle = setTimeout(startPrefetch, 1000);
    }
    
    return () => {
      abortRef.current = true;
      if (idleHandle !== undefined) {
        cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [pages, currentPageIndex, prefetchCount, enabled, prefetchPages]);

  // Also prefetch current page if not already cached
  useEffect(() => {
    if (!enabled || pages.length === 0) return;
    
    const currentPage = pages[currentPageIndex];
    if (!currentPage?.title || prefetchedRef.current.has(currentPage.id)) {
      return;
    }
    
    // Prefetch current page immediately (higher priority)
    prefetchTTSAudio(currentPage.title, voiceId).then(success => {
      if (success) {
        prefetchedRef.current.add(currentPage.id);
      }
    });
  }, [pages, currentPageIndex, voiceId, enabled]);

  return {
    /** Number of pages prefetched in this session */
    prefetchedCount: prefetchedRef.current.size,
  };
}
