/**
 * PHASE 3 OPTIMIZATION: Cache warming strategy
 * Preloads critical images on app startup for instant first-time loads
 */

import { supabase } from '@/integrations/supabase/client';
import { optimizeImageUrl } from './imageOptimization';
import { prefetchImagesToCache } from './imageCaching';

/**
 * Warm the cache with the most critical images
 * - Active daily published content (today's book)
 * - Next 3 upcoming books
 * - Most recent library highlights
 */
export async function warmCriticalCache() {
  if (!('serviceWorker' in navigator)) {
    console.log('[Cache Warming] Service worker not available');
    return;
  }

  try {
    console.log('[Cache Warming] Starting critical cache warming...');

    // Fetch SEO metadata for active and upcoming daily published content
    const { data: upcomingSeoData } = await supabase
      .from('seo_metadata')
      .select('og_image_url, daily_published_id, daily_published!inner(status, publish_date)')
      .in('daily_published.status', ['active', 'queued'])
      .eq('is_latest', true)
      .eq('is_active', true)
      .order('daily_published.publish_date', { ascending: true })
      .limit(4);

    // Fetch SEO metadata for highlighted library books
    const { data: highlightedSeoData } = await supabase
      .from('seo_metadata')
      .select('og_image_url')
      .eq('is_latest', true)
      .eq('is_active', true)
      .not('daily_published_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6);

    // Collect image URLs
    const imageUrls: string[] = [];

    // Add upcoming content images
    upcomingSeoData?.forEach((item) => {
      if (item.og_image_url) {
        imageUrls.push(item.og_image_url);
      }
    });

    // Add highlighted book images
    highlightedSeoData?.forEach((item) => {
      if (item.og_image_url) {
        imageUrls.push(item.og_image_url);
      }
    });

    // Deduplicate and optimize URLs
    const uniqueUrls = [...new Set(imageUrls)].filter(Boolean);

    if (uniqueUrls.length > 0) {
      console.log(`[Cache Warming] Warming cache with ${uniqueUrls.length} critical images`);
      await prefetchImagesToCache(uniqueUrls);
      console.log('[Cache Warming] ✅ Critical cache warmed successfully');
    } else {
      console.log('[Cache Warming] No critical images to cache');
    }
  } catch (error) {
    console.error('[Cache Warming] Failed:', error);
  }
}

/**
 * Warm cache on app startup (with delay to not block initial render)
 * Call this from App.tsx or main.tsx
 */
export function initializeCacheWarming() {
  // Wait 2 seconds after app load to start warming cache
  // This ensures the app is interactive before we start background work
  setTimeout(() => {
    warmCriticalCache();
  }, 2000);
}
