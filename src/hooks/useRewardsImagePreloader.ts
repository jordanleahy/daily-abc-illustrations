import { useEffect } from 'react';
import type { RewardsProduct } from '@/types/rewardsProduct';

/**
 * Hook to preload rewards product images for instant display
 * Images are cached by the service worker for 7 days
 */
export function useRewardsImagePreloader(products: RewardsProduct[] | undefined) {
  useEffect(() => {
    if (!products || products.length === 0) return;

    // Preload first 3 product images immediately
    const criticalProducts = products.slice(0, 3);
    criticalProducts.forEach((product) => {
      if (product.product_image_url) {
        const img = new Image();
        img.src = product.product_image_url;
      }
    });

    // Preload remaining images after 500ms
    if (products.length > 3) {
      const timeoutId = setTimeout(() => {
        const remainingProducts = products.slice(3);
        remainingProducts.forEach((product) => {
          if (product.product_image_url) {
            const img = new Image();
            img.src = product.product_image_url;
          }
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [products]);
}
