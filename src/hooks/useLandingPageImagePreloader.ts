import { useEffect } from 'react';
import type { LandingPageData } from './useLandingPageData';
import { optimizeImageUrl } from '@/utils/imageOptimization';

/**
 * Progressive image preloader for landing page
 * Prioritizes viewport images first, then loads below-the-fold images
 * 
 * Priority order:
 * 1. Hero carousel (first 3 pages) - Immediate (in viewport)
 * 2. Popular books (first 3) - 100ms delay (near viewport)
 * 3. Remaining hero pages - 200ms delay
 * 4. Remaining popular books - 300ms delay
 * 5. Library books - 500ms delay (below fold)
 */
export function useLandingPageImagePreloader(landingData: LandingPageData | undefined) {
  useEffect(() => {
    if (!landingData) return;

    const timeouts: NodeJS.Timeout[] = [];

    // Extract all images in priority order
    const heroImages = landingData.dailyPublished?.pages?.map(p => p.image_url).filter(Boolean) || [];
    const popularImages = landingData.popularBooks?.map(b => b.image_url).filter(Boolean) || [];
    const libraryImages = landingData.libraryBooks?.map(b => b.og_image_url).filter(Boolean) || [];

    // Priority 1: First 3 hero carousel images (immediate - in viewport)
    const criticalHeroImages = heroImages.slice(0, 3);
    criticalHeroImages.forEach(url => {
      if (url) {
        const img = new Image();
        img.src = optimizeImageUrl(url, { width: 800, quality: 85 }) || url;
      }
    });

    // Priority 2: First 3 popular books (100ms - near viewport)
    if (popularImages.length > 0) {
      timeouts.push(setTimeout(() => {
        const criticalPopular = popularImages.slice(0, 3);
        criticalPopular.forEach(url => {
          if (url) {
            const img = new Image();
            img.src = optimizeImageUrl(url, { width: 400, quality: 80 }) || url;
          }
        });
      }, 100));
    }

    // Priority 3: Remaining hero images (200ms)
    if (heroImages.length > 3) {
      timeouts.push(setTimeout(() => {
        const remainingHero = heroImages.slice(3);
        remainingHero.forEach(url => {
          if (url) {
            const img = new Image();
            img.src = optimizeImageUrl(url, { width: 800, quality: 85 }) || url;
          }
        });
      }, 200));
    }

    // Priority 4: Remaining popular books (300ms)
    if (popularImages.length > 3) {
      timeouts.push(setTimeout(() => {
        const remainingPopular = popularImages.slice(3);
        remainingPopular.forEach(url => {
          if (url) {
            const img = new Image();
            img.src = optimizeImageUrl(url, { width: 400, quality: 80 }) || url;
          }
        });
      }, 300));
    }

    // Priority 5: Library books (500ms - below fold)
    if (libraryImages.length > 0) {
      timeouts.push(setTimeout(() => {
        libraryImages.forEach(url => {
          if (url) {
            const img = new Image();
            img.src = optimizeImageUrl(url, { width: 600, quality: 80 }) || url;
          }
        });
      }, 500));
    }

    return () => timeouts.forEach(t => clearTimeout(t));
  }, [landingData]);
}
