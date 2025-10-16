import { useEffect, useRef } from 'react';
import { optimizeImageUrl } from '@/utils/imageOptimization';

interface CarouselImage {
  id: string;
  image_url: string | null;
}

/**
 * Lazy loading hook for carousel images
 * Only loads current image immediately, prefetches adjacent images on navigation
 * Implements memory caching to prevent re-downloads
 */
export function useLazyCarouselImages(
  images: CarouselImage[] | undefined,
  currentIndex: number
) {
  const loadedImages = useRef<Set<string>>(new Set());
  const pendingLoads = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!images || images.length === 0) return;

    const imagesToPreload: string[] = [];
    
    // Always load current image
    const currentImage = images[currentIndex]?.image_url;
    if (currentImage && !loadedImages.current.has(currentImage)) {
      imagesToPreload.push(currentImage);
    }

    // Prefetch next image (if exists)
    if (currentIndex < images.length - 1) {
      const nextImage = images[currentIndex + 1]?.image_url;
      if (nextImage && !loadedImages.current.has(nextImage)) {
        imagesToPreload.push(nextImage);
      }
    }

    // Prefetch previous image (if exists)
    if (currentIndex > 0) {
      const prevImage = images[currentIndex - 1]?.image_url;
      if (prevImage && !loadedImages.current.has(prevImage)) {
        imagesToPreload.push(prevImage);
      }
    }

    // Load images that haven't been loaded yet
    imagesToPreload.forEach(url => {
      if (!pendingLoads.current.has(url)) {
        pendingLoads.current.add(url);
        
        const optimizedUrl = optimizeImageUrl(url, { width: 800, quality: 85 });
        if (optimizedUrl) {
          const img = new Image();
          img.src = optimizedUrl;
          img.onload = () => {
            loadedImages.current.add(url);
            pendingLoads.current.delete(url);
          };
          img.onerror = () => {
            pendingLoads.current.delete(url);
          };
        }
      }
    });
  }, [images, currentIndex]);

  return null;
}
