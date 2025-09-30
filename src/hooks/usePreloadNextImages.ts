import { useEffect } from 'react';

/**
 * Simple hook to preload next page images using native browser preloading
 * Preloads the next 3 images after the current page
 */
export function usePreloadNextImages(
  imageUrls: string[],
  currentIndex: number
) {
  useEffect(() => {
    // Preload next 3 images using native browser hints
    const nextImages = imageUrls.slice(currentIndex + 1, currentIndex + 4);
    
    const links: HTMLLinkElement[] = [];
    
    nextImages.forEach((url) => {
      if (url) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
        links.push(link);
      }
    });
    
    // Cleanup: remove preload hints when component unmounts or index changes
    return () => {
      links.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [imageUrls, currentIndex]);
}
