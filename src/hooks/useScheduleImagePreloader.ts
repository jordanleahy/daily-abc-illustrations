import { useImagePreloader } from './useImagePreloader';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';

/**
 * Hook to preload schedule/queue book images for instant display
 * Uses unified image preloader with service worker caching
 */
export function useScheduleImagePreloader(scheduleItems: DailyPublishedWithBook[] | undefined) {
  const imageUrls = scheduleItems?.map(item => item.og_image_url).filter(Boolean) || [];
  
  useImagePreloader(imageUrls, {
    priority: false,
    width: 800,
    quality: 85,
    batchSize: 5,
    batchDelay: 200
  });
}
