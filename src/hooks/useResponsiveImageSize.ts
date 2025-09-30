import { useIsMobile } from './use-mobile';

export interface ImageSize {
  width: number;
  height: number;
}

/**
 * Hook to determine optimal image dimensions based on device type
 * Returns square dimensions to match aspect-square containers
 * Mobile: 768x768px (optimized for small screens)
 * Desktop: 1024x1024px (matches source image size)
 */
export function useResponsiveImageSize(): ImageSize {
  const isMobile = useIsMobile();
  
  return isMobile 
    ? { width: 768, height: 768 }    // Mobile-optimized square
    : { width: 1024, height: 1024 }; // Desktop square
}
