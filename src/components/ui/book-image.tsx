/**
 * ⚠️ CRITICAL COMPONENT - DO NOT REPLACE WITH PLAIN <img> TAGS
 * 
 * This component provides 75-85% bandwidth savings through:
 * - Automatic image optimization (WebP/AVIF conversion)
 * - Service worker caching for instant repeat loads
 * - Responsive srcSet generation
 * - Skeleton-first loading with gradient placeholders
 * - Performance monitoring integration
 * 
 * See: docs/IMAGE_OPTIMIZATION_ARCHITECTURE.md
 * 
 * ALWAYS use this component for Supabase storage images.
 * DO NOT create duplicate image components.
 */

import { useState } from 'react';
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
  disableHoverEffects?: boolean;
}

/**
 * Unified image component for all book images across the app
 * Handles optimization, responsive srcSet, loading states, gradient placeholder, and performance tracking
 */
export function BookImage({
  src,
  alt,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 800px",
  onLoad,
  onError,
  enableMobileSave = false,
  disableHoverEffects = false
}: BookImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Runtime validation (development only)
  if (process.env.NODE_ENV === 'development') {
    if (!alt) {
      console.warn('[BookImage] Missing alt text:', src);
    }
  }
  
  if (!src) {
    return (
      <div className={`bg-gradient-to-br from-muted via-muted/50 to-muted ${className}`} />
    );
  }

  const optimizedUrl = optimizeImageUrl(src, { width: 800, quality: 85 });
  const srcSet = generateSrcSet(src, [400, 800, 1200]);
  
  // PHASE 4: Create performance tracker for this image
  const performanceTracker = createImageLoadTracker(optimizedUrl || src);
  
  // Runtime check: Warn if image URL is not optimized (development only)
  if (process.env.NODE_ENV === 'development' && src?.includes('supabase.co/storage')) {
    if (!optimizedUrl?.includes('width=') || !optimizedUrl?.includes('quality=')) {
      console.warn('[BookImage] Image URL not properly optimized:', src);
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Gradient placeholder - prevents layout shift, fades out when image loads */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-muted via-muted/50 to-muted"
        style={{ 
          opacity: imageLoaded ? 0 : 1,
          transition: 'opacity 300ms ease-out'
        }}
      />
      
      {/* Main image with crossfade */}
      <div
        className="absolute inset-0"
        style={{
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 300ms ease-out'
        }}
      >
        <img
          src={optimizedUrl || src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          crossOrigin="anonymous"
          data-optimized="true"
          className={`transition-all duration-300 ease-out ${disableHoverEffects ? '' : 'hover:scale-110 hover:rotate-2'} ${className}`}
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
    </div>
  );
}
