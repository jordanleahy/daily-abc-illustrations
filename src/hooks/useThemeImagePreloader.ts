import { useEffect } from 'react';
import { characterThemes } from '@/config/characterThemes';

/**
 * Preload all character theme images on Google Chat page load
 * Ensures smooth first load and instant repeat visits via service worker cache
 */
export function useThemeImagePreloader() {
  useEffect(() => {
    // Extract all theme image URLs
    const themeUrls = Object.values(characterThemes).map(theme => theme.thumbnail);
    
    // Preload using native browser hints for instant display
    const preloadLinks: HTMLLinkElement[] = [];
    
    themeUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
      preloadLinks.push(link);
      
      // Also create Image objects to trigger browser cache
      const img = new Image();
      img.src = url;
    });
    
    // Register with service worker cache for offline/instant repeat loads
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PREFETCH_IMAGES',
        urls: themeUrls
      });
    }
    
    return () => {
      // Cleanup preload hints
      preloadLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, []);
}
