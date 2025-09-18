import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Shimmer } from './shimmer';
import { getSupportedImageFormat, buildOptimizedImageUrl, getResponsiveImageProps } from '@/utils/imageOptimization';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { imagePerformanceTracker } from '@/utils/imagePerformance';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  showShimmer?: boolean;
  responsive?: boolean;
  widths?: number[];
  quality?: number;
  sizes?: string;
  critical?: boolean;
  blurDataURL?: string;
  rootMargin?: string;
}

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ 
    src, 
    alt, 
    className, 
    fallbackSrc, 
    showShimmer = true, 
    responsive = true,
    widths = [400, 800, 1200],
    quality = 80,
    sizes,
    critical = false,
    blurDataURL,
    rootMargin = '200px',
    ...props 
  }, ref) => {
    const [currentSrc, setCurrentSrc] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [formatIndex, setFormatIndex] = useState(0);
    const [shouldLoad, setShouldLoad] = useState(critical);
    const [showBlur, setShowBlur] = useState(!!blurDataURL);

    // Use intersection observer for non-critical images
    const { ref: intersectionRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
      rootMargin,
      triggerOnce: true,
      disabled: critical,
    });

    // Get supported formats in priority order (AVIF > WebP > PNG)
    const supportedFormats = getSupportedImageFormat();
    
    // Get responsive image props if responsive mode is enabled
    const responsiveProps = responsive 
      ? getResponsiveImageProps(src, { widths, quality, sizes })
      : null;
    
    // Handle when image should start loading
    useEffect(() => {
      if (critical || isIntersecting) {
        setShouldLoad(true);
      }
    }, [critical, isIntersecting]);

    useEffect(() => {
      if (!shouldLoad) return;

      // Reset states when src changes
      setIsLoading(true);
      setHasError(false);
      setFormatIndex(0);
      
      // Use responsive src or build optimized URL
      const initialUrl = responsive 
        ? responsiveProps?.src || src
        : buildOptimizedImageUrl(src, supportedFormats[0]);
      
      setCurrentSrc(initialUrl);
      imagePerformanceTracker.startLoading(initialUrl);
    }, [shouldLoad, src, supportedFormats, responsive, responsiveProps]);

    const handleLoad = useCallback(() => {
      setIsLoading(false);
      setHasError(false);
      setShowBlur(false);
      
      if (currentSrc) {
        imagePerformanceTracker.endLoading(currentSrc, false);
      }
    }, [currentSrc]);

    const handleError = useCallback(() => {
      const nextFormatIndex = formatIndex + 1;
      
      // Try next format if available
      if (nextFormatIndex < supportedFormats.length) {
        setFormatIndex(nextFormatIndex);
        const nextUrl = buildOptimizedImageUrl(src, supportedFormats[nextFormatIndex]);
        setCurrentSrc(nextUrl);
        imagePerformanceTracker.startLoading(nextUrl);
        return;
      }
      
      // If all formats failed and we have a fallback, use it
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        imagePerformanceTracker.startLoading(fallbackSrc);
        return;
      }
      
      // If original URL wasn't tried yet, try it as final fallback
      if (currentSrc !== src) {
        setCurrentSrc(src);
        imagePerformanceTracker.startLoading(src);
        return;
      }
      
      // All fallbacks exhausted
      setIsLoading(false);
      setHasError(true);
      setShowBlur(false);
    }, [formatIndex, supportedFormats, src, fallbackSrc, currentSrc]);

    return (
      <div 
        ref={intersectionRef}
        className={cn("relative overflow-hidden", className)}
      >
        {/* Blur placeholder */}
        {showBlur && blurDataURL && (
          <img
            src={blurDataURL}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 transition-opacity duration-300"
            style={{ filter: 'blur(10px)' }}
            aria-hidden="true"
          />
        )}
        
        {/* Show shimmer while loading if enabled and no blur */}
        {isLoading && showShimmer && !showBlur && (
          <Shimmer className="absolute inset-0 w-full h-full" />
        )}
        
        {/* Show error state */}
        {hasError && (
          <div className="absolute inset-0 w-full h-full bg-muted/50 flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Failed to load image</div>
          </div>
        )}
        
        {/* Actual image */}
        {shouldLoad && currentSrc && (
          <img
            ref={ref}
            src={currentSrc}
            srcSet={responsive ? responsiveProps?.srcSet : undefined}
            sizes={responsive ? responsiveProps?.sizes : undefined}
            alt={alt}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={handleLoad}
            onError={handleError}
            loading={critical ? "eager" : "lazy"}
            {...props}
          />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';