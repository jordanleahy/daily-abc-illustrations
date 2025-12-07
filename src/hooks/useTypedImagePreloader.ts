import { useMemo } from 'react';
import { useImagePreloader } from './useImagePreloader';

interface PreloaderConfig {
  /** Number of images to treat as high priority (default: 3) */
  priorityCount?: number;
  /** Image width for optimization (default: 800) */
  width?: number;
  /** Image quality (default: 85) */
  quality?: number;
  /** Batch size for non-priority images (default: 5) */
  batchSize?: number;
  /** Delay between batches in ms (default: 150) */
  batchDelay?: number;
}

const DEFAULT_CONFIG: Required<PreloaderConfig> = {
  priorityCount: 3,
  width: 800,
  quality: 85,
  batchSize: 5,
  batchDelay: 150,
};

/**
 * Generic image preloader that accepts any data type and an extractor function.
 * Consolidates the common pattern of splitting URLs into priority/remaining batches.
 * 
 * @example
 * // For books with coverImageUrl
 * useTypedImagePreloader(books, book => book.coverImageUrl, { priorityCount: 6 });
 * 
 * // For page images record
 * useTypedImagePreloader(
 *   pageImages ? Object.entries(pageImages).sort(([a], [b]) => Number(a) - Number(b)) : [],
 *   ([_, url]) => url
 * );
 */
export function useTypedImagePreloader<T>(
  data: T[] | undefined,
  extractor: (item: T) => string | null | undefined,
  config: PreloaderConfig = {}
): void {
  const {
    priorityCount,
    width,
    quality,
    batchSize,
    batchDelay,
  } = { ...DEFAULT_CONFIG, ...config };

  // Extract and filter valid URLs
  const imageUrls = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(extractor).filter((url): url is string => !!url);
  }, [data, extractor]);

  // Split into priority and remaining batches
  const priorityUrls = useMemo(() => imageUrls.slice(0, priorityCount), [imageUrls, priorityCount]);
  const remainingUrls = useMemo(() => imageUrls.slice(priorityCount), [imageUrls, priorityCount]);

  // Preload priority images immediately
  useImagePreloader(priorityUrls, {
    priority: true,
    width,
    quality,
    batchSize: priorityCount,
    batchDelay: 0,
  });

  // Preload remaining images with batching
  useImagePreloader(remainingUrls, {
    priority: false,
    width,
    quality,
    batchSize,
    batchDelay,
  });
}

/**
 * Creates a specialized preloader hook with fixed configuration.
 * Use this to create domain-specific hooks with consistent settings.
 * 
 * @example
 * export const useBookCoverPreloader = createImagePreloader<Book>(
 *   book => book.coverImageUrl,
 *   { priorityCount: 6, width: 800 }
 * );
 */
export function createImagePreloader<T>(
  extractor: (item: T) => string | null | undefined,
  defaultConfig: PreloaderConfig = {}
) {
  return function usePreloader(data: T[] | undefined, config: PreloaderConfig = {}) {
    useTypedImagePreloader(data, extractor, { ...defaultConfig, ...config });
  };
}
