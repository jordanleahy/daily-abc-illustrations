import { useState } from 'react';
import { Shimmer } from '@/components/ui/shimmer';
import { optimizeImageUrl, generateSrcSet } from '@/utils/imageOptimization';
import { createImageLoadTracker } from '@/utils/performanceMonitoring';

interface BookImageProps {
  src: string | undefined;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  enableMobileSave?: boolean;
}

/**
 * Unified image component for all book images across the app
 * Handles optimization, responsive srcSet, loading states, shimmer effect, and performance tracking
 */
export function BookImage({
  src,
  alt,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 800px",
  onLoad,
  onError,
  enableMobileSave = false
}: BookImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  if (!src) {
    return (
      <Shimmer className={className} isShimmering={true} />
    );
  }

  const optimizedUrl = optimizeImageUrl(src, { width: 800, quality: 85 });
  const srcSet = generateSrcSet(src, [400, 800, 1200]);
  
  // PHASE 4: Create performance tracker for this image
  const performanceTracker = createImageLoadTracker(optimizedUrl || src);

  return (
    <div className="relative w-full h-full">
      {!imageLoaded && <Shimmer className="absolute inset-0" isShimmering={true} />}
      <img
        src={optimizedUrl || src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        crossOrigin="anonymous"
        className={`transition-opacity duration-200 ${className} ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={enableMobileSave ? { 
          touchAction: 'auto', 
          WebkitTouchCallout: 'default' 
        } : undefined}
        onLoad={() => {
          setImageLoaded(true);
          performanceTracker.onLoad(); // Track performance
          onLoad?.();
        }}
        onError={() => {
          performanceTracker.onError(); // Track errors
          onError?.();
        }}
        onContextMenu={enableMobileSave ? (e) => {
          // Allow default context menu for mobile save
        } : undefined}
      />
    </div>
  );
}
