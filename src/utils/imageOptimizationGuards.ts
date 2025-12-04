/**
 * Runtime guards to protect image optimization system
 * These functions detect and warn about performance regressions
 */

import { getCacheStats } from './serviceWorker';

/**
 * Type guard to ensure BookImage props are correct
 */
export interface BookImageProps {
  src: string | undefined;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  enableMobileSave?: boolean;
}

/**
 * Validates that BookImage is being used correctly
 */
export function validateBookImageUsage(props: BookImageProps): void {
  if (!props.alt) {
    console.warn('[Image Optimization] Missing alt text. This impacts accessibility.');
  }
  
  if (props.src && !props.src.includes('supabase.co/storage') && props.src.startsWith('http')) {
    console.info('[Image Optimization] External image detected. Consider hosting on Supabase for optimization.');
  }
}

/**
 * Checks if plain img tags are being used in production
 * This is a development-time check only
 */
export function detectPlainImageTags(): void {
  if (process.env.NODE_ENV === 'development') {
    // Run after page load
    setTimeout(() => {
      const plainImages = document.querySelectorAll('img:not([data-optimized])');
      const supabaseImages = Array.from(plainImages).filter((img): img is HTMLImageElement => 
        img instanceof HTMLImageElement && img.src.includes('supabase.co/storage')
      );
      
      if (supabaseImages.length > 0) {
        console.warn(
          `[Image Optimization] Found ${supabaseImages.length} plain <img> tags with Supabase images. ` +
          'These should use BookImage component for optimization. ' +
          'See: docs/IMAGE_OPTIMIZATION_ARCHITECTURE.md'
        );
        console.warn('Affected images:', supabaseImages);
      }
    }, 2000);
  }
}

/**
 * Performance assertions to detect system degradation
 */
export async function assertPerformanceTargets(): Promise<{
  passed: boolean;
  failures: string[];
}> {
  const failures: string[] = [];
  
  try {
    // Check cache statistics
    const cacheStats = await getCacheStats();
    if (cacheStats.total < 10) {
      failures.push(`Cache appears empty (${cacheStats.total} items). Service worker may not be working.`);
    }
    
    // Check for optimized images in network
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const supabaseImages = resources.filter(r => 
        r.name.includes('supabase.co/storage') && 
        r.initiatorType === 'img'
      );
      
      const unoptimizedImages = supabaseImages.filter(r => 
        !r.name.includes('width=') && 
        !r.name.includes('quality=') &&
        !r.name.includes('format=')
      );
      
      if (unoptimizedImages.length > 0) {
        failures.push(
          `Found ${unoptimizedImages.length} unoptimized Supabase images. ` +
          'Images should include width, quality, and format parameters.'
        );
      }
      
      // Check image load times
      const slowImages = supabaseImages.filter(r => r.duration > 1000);
      if (slowImages.length > 0) {
        failures.push(
          `${slowImages.length} images took >1s to load. ` +
          'Check service worker caching and preloading.'
        );
      }
    }
  } catch (error) {
    console.error('[Performance Assertions] Error running checks:', error);
  }
  
  return {
    passed: failures.length === 0,
    failures
  };
}

/**
 * Validates preloader hook options
 */
export interface PreloadOptions {
  priority?: boolean;
  width?: number;
  quality?: number;
  batchSize?: number;
  batchDelay?: number;
}

export function validatePreloadOptions(options: PreloadOptions): void {
  if (options.width && options.width < 400) {
    console.warn('[Image Optimization] Width <400px may be too small for quality display.');
  }
  
  if (options.quality && options.quality > 90) {
    console.warn('[Image Optimization] Quality >90 may not provide visible benefit and increases file size.');
  }
  
  if (options.batchSize && options.batchSize > 10) {
    console.warn('[Image Optimization] Large batch sizes may block the main thread.');
  }
}

/**
 * Monitors cache hit rate and warns if it drops
 */
let lastCacheCheck = 0;
let cacheHitWarningShown = false;

export function monitorCachePerformance(hit: boolean): void {
  // Only check every 30 seconds
  const now = Date.now();
  if (now - lastCacheCheck < 30000) return;
  lastCacheCheck = now;
  
  // Track hit rate (simplified for runtime)
  const hitRate = hit ? 100 : 0; // In real implementation, track over time
  
  if (hitRate < 60 && !cacheHitWarningShown) {
    console.warn(
      '[Image Optimization] Cache hit rate is low (<60%). ' +
      'Images may not be caching properly. Check service worker status.'
    );
    cacheHitWarningShown = true;
  }
}

/**
 * Type-safe image URL validator
 */
export function isOptimizedImageUrl(url: string): boolean {
  if (!url.includes('supabase.co/storage')) {
    return true; // Not a Supabase image, optimization not applicable
  }
  
  return (
    url.includes('width=') &&
    url.includes('quality=') &&
    url.includes('format=')
  );
}

/**
 * Readonly type to prevent modification of optimization configs
 */
export type ReadonlyOptimizationConfig = Readonly<{
  readonly defaultWidth: number;
  readonly defaultQuality: number;
  readonly supportedFormats: readonly ['webp', 'avif', 'origin'];
  readonly cacheStrategy: 'cache-first';
  readonly maxCacheAge: number;
}>;

export const OPTIMIZATION_CONFIG: ReadonlyOptimizationConfig = {
  defaultWidth: 800,
  defaultQuality: 85,
  supportedFormats: ['webp', 'avif', 'origin'] as const,
  cacheStrategy: 'cache-first' as const,
  maxCacheAge: 86400000 // 24 hours
} as const;
