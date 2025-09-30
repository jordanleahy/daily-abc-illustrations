import { useIsMobile } from './use-mobile';

export interface ImageSize {
  width: number;
  height: number;
}

/**
 * Hook to determine optimal image dimensions based on device type
 * Mobile: 400x267px (3:2 ratio, optimized for small screens)
 * Desktop: 600x400px (3:2 ratio, higher quality for larger displays)
 */
export function useResponsiveImageSize(): ImageSize {
  const isMobile = useIsMobile();
  
  return isMobile 
    ? { width: 400, height: 267 }    // Mobile-optimized size
    : { width: 600, height: 400 };   // Desktop size
}
