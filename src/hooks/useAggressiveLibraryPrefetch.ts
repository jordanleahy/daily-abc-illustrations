/**
 * PHASE 1: Aggressive library prefetching hook
 * Prefetches ALL library book page images in the background
 * Uses progressive batching to avoid blocking main thread
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { prefetchImagesToCache } from '@/utils/imageCaching';
import type { LibraryBook } from '@/types/library';

interface PrefetchProgress {
  total: number;
  prefetched: number;
  failed: number;
}

/**
 * Aggressively prefetch all library book images in background batches
 * Designed for mobile with progressive loading and network awareness
 */
export function useAggressiveLibraryPrefetch(
  books: LibraryBook[] | undefined,
  enabled: boolean = true
) {
  const prefetchedRef = useRef(new Set<string>());
  const progressRef = useRef<PrefetchProgress>({ total: 0, prefetched: 0, failed: 0 });

  useEffect(() => {
    if (!enabled || !books || books.length === 0) return;

    // Wait 2 seconds for initial render to complete
    const initialDelay = setTimeout(() => {
      startAggressivePrefetch(books);
    }, 2000);

    return () => clearTimeout(initialDelay);
  }, [books, enabled]);

  async function startAggressivePrefetch(books: LibraryBook[]) {
    console.log('[Aggressive Prefetch] Starting for', books.length, 'books');
    
    // Split books into 3 batches for progressive loading
    const batch1 = books.slice(0, 6);   // First 6 books - immediate
    const batch2 = books.slice(6, 18);  // Next 12 books - 1s delay
    const batch3 = books.slice(18);     // Remaining books - 3s delay

    // Batch 1: Priority books (first 6 visible)
    await prefetchBookBatch(batch1, 'Priority');

    // Batch 2: Secondary books (next 12)
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (document.hidden) {
      console.log('[Aggressive Prefetch] Tab hidden, pausing batch 2');
      return;
    }
    await prefetchBookBatch(batch2, 'Secondary');

    // Batch 3: Remaining books
    await new Promise(resolve => setTimeout(resolve, 3000));
    if (document.hidden) {
      console.log('[Aggressive Prefetch] Tab hidden, pausing batch 3');
      return;
    }
    await prefetchBookBatch(batch3, 'Tertiary');

    console.log('[Aggressive Prefetch] Complete:', progressRef.current);
  }

  async function prefetchBookBatch(
    books: LibraryBook[],
    batchName: string
  ) {
    console.log(`[Aggressive Prefetch] ${batchName} batch: ${books.length} books`);

    // For each book, fetch all page images
    for (const book of books) {
      if (prefetchedRef.current.has(book.id)) continue;

      try {
        // Use requestIdleCallback for non-blocking execution
        await new Promise<void>((resolve) => {
          const callback = async () => {
            await prefetchBookPages(book);
            prefetchedRef.current.add(book.id);
            resolve();
          };

          if ('requestIdleCallback' in window) {
            requestIdleCallback(callback, { timeout: 5000 });
          } else {
            callback();
          }
        });
      } catch (error) {
        console.error(`[Aggressive Prefetch] Failed for book ${book.id}:`, error);
        progressRef.current.failed++;
      }
    }
  }

  async function prefetchBookPages(book: LibraryBook) {
    try {
      // Fetch all page images for this book
      const { data: pageImages, error } = await supabase
        .from('page_image_urls')
        .select('image_url, pages!inner(page_number)')
        .eq('book_id', book.id)
        .eq('is_latest', true)
        .not('image_url', 'is', null)
        .order('pages(page_number)', { ascending: true });

      if (error) {
        console.error(`[Aggressive Prefetch] Failed to fetch pages for ${book.id}:`, error);
        return;
      }

      if (!pageImages || pageImages.length === 0) {
        return;
      }

      // Extract image URLs
      const imageUrls = pageImages
        .map((p: any) => p.image_url)
        .filter((url: string | null): url is string => !!url);

      if (imageUrls.length === 0) return;

      progressRef.current.total += imageUrls.length;

      // Prefetch images to service worker cache
      await prefetchImagesToCache(imageUrls);
      
      progressRef.current.prefetched += imageUrls.length;

      console.log(
        `[Aggressive Prefetch] Book ${book.book_name}: ${imageUrls.length} images cached ` +
        `(${progressRef.current.prefetched}/${progressRef.current.total})`
      );
    } catch (error) {
      console.error(`[Aggressive Prefetch] Failed to prefetch book ${book.id}:`, error);
      throw error;
    }
  }

  return {
    progress: progressRef.current
  };
}
