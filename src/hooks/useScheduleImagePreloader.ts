import { useTypedImagePreloader } from './useTypedImagePreloader';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';

/**
 * Hook to preload schedule/queue book images for instant display
 * Uses unified image preloader with service worker caching
 */
export function useScheduleImagePreloader(scheduleItems: DailyPublishedWithBook[] | undefined) {
  useTypedImagePreloader(
    scheduleItems,
    item => item.og_image_url,
    { priorityCount: 0, width: 800, batchSize: 5, batchDelay: 200 }
  );
}
