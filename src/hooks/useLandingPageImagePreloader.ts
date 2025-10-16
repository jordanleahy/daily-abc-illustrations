import { useEffect } from 'react';
import type { LandingPageData } from './useLandingPageData';
import { optimizeImageUrl } from '@/utils/imageOptimization';

/**
 * Progressive image preloader for landing page with browser-native hints
 * Uses <link rel="preload"> for critical images and intelligent batching for others
 * 
 * Priority order:
 * 1. Hero carousel (first 3 pages) - Immediate preload with high priority
 * 2. Popular books (first 3) - 50ms delay (near viewport)
 * 3. Remaining hero pages - 100ms delay
 * 4. Remaining popular books - 200ms delay
 * 5. Library books - 300ms delay (below fold)
 */
export function useLandingPageImagePreloader(landingData: LandingPageData | undefined) {
  useEffect(() => {
    if (!landingData) return;

    const timeouts: NodeJS.Timeout[] = [];
    const preloadLinks: HTMLLinkElement[] = [];

    // Extract all images in priority order
    const heroImages = landingData.dailyPublished?.pages?.map(p => p.image_url).filter(Boolean) || [];
    const popularImages = landingData.popularBooks?.map(b => b.image_url).filter(Boolean) || [];
    const libraryImages = landingData.libraryBooks?.map(b => b.og_image_url).filter(Boolean) || [];

    // Priority 1: ONLY first hero carousel image (critical viewport content)
    // Remaining hero images load lazily via useLazyCarouselImages
    const firstHeroImage = heroImages[0];
    if (firstHeroImage) {
      const optimizedUrl = optimizeImageUrl(firstHeroImage, { width: 800, quality: 85 });
      if (optimizedUrl) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = optimizedUrl;
        link.fetchPriority = 'high';
        link.type = 'image/webp';
        document.head.appendChild(link);
        preloadLinks.push(link);
      }
    }

    // Priority 2: First 3 popular books (50ms - near viewport)
    if (popularImages.length > 0) {
      timeouts.push(setTimeout(() => {
        const criticalPopular = popularImages.slice(0, 3);
        criticalPopular.forEach(url => {
          if (url) {
            const img = new Image();
            img.src = optimizeImageUrl(url, { width: 600, quality: 85 }) || url;
          }
        });
      }, 50));
    }

    // Priority 3: Remaining hero images are NOT preloaded
    // They load on-demand via useLazyCarouselImages when user navigates

    // Priority 4: Remaining popular books (200ms)
    if (popularImages.length > 3) {
      timeouts.push(setTimeout(() => {
        const remainingPopular = popularImages.slice(3);
        remainingPopular.forEach(url => {
          if (url) {
            const img = new Image();
            img.src = optimizeImageUrl(url, { width: 600, quality: 85 }) || url;
          }
        });
      }, 200));
    }

    // Priority 5: Library books (300ms - below fold)
    if (libraryImages.length > 0) {
      timeouts.push(setTimeout(() => {
        libraryImages.forEach(url => {
          if (url) {
            const img = new Image();
            img.src = optimizeImageUrl(url, { width: 600, quality: 80 }) || url;
          }
        });
      }, 300));
    }

    return () => {
      timeouts.forEach(t => clearTimeout(t));
      // Clean up preload links
      preloadLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [landingData]);
}
