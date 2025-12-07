import { useTypedImagePreloader } from './useTypedImagePreloader';
import type { RewardsProduct } from '@/types/rewardsProduct';

/**
 * Hook to preload rewards product images for instant display
 * Uses unified image preloader with service worker caching
 */
export function useRewardsImagePreloader(products: RewardsProduct[] | undefined) {
  useTypedImagePreloader(
    products,
    p => p.product_image_url,
    { priorityCount: 0, width: 600, batchSize: 3, batchDelay: 300 }
  );
}
