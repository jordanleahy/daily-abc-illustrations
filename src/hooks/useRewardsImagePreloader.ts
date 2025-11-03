import { useImagePreloader } from './useImagePreloader';
import type { RewardsProduct } from '@/types/rewardsProduct';

/**
 * Hook to preload rewards product images for instant display
 * Uses unified image preloader with service worker caching
 */
export function useRewardsImagePreloader(products: RewardsProduct[] | undefined) {
  const imageUrls = products?.map(p => p.product_image_url).filter(Boolean) || [];
  
  useImagePreloader(imageUrls, {
    priority: false,
    width: 600,
    quality: 85,
    batchSize: 3,
    batchDelay: 300
  });
}
