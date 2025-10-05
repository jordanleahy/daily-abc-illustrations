import { useEffect } from 'react';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';

/**
 * Hook to preload schedule/queue book images for instant display
 * Images are cached by the service worker for 30 days
 */
export function useScheduleImagePreloader(scheduleItems: DailyPublishedWithBook[] | undefined) {
  useEffect(() => {
    if (!scheduleItems || scheduleItems.length === 0) return;

    // Preload first 5 schedule item images immediately (visible in preview)
    const criticalItems = scheduleItems.slice(0, 5);
    criticalItems.forEach((item) => {
      if (item.og_image_url) {
        const img = new Image();
        img.src = item.og_image_url;
      }
    });

    // Preload remaining images after 300ms
    if (scheduleItems.length > 5) {
      const timeoutId = setTimeout(() => {
        const remainingItems = scheduleItems.slice(5);
        remainingItems.forEach((item) => {
          if (item.og_image_url) {
            const img = new Image();
            img.src = item.og_image_url;
          }
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [scheduleItems]);
}
