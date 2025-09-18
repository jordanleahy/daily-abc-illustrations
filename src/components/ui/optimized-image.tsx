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
  shimmerVariant?: 'default' | 'skeleton' | 'blur-up' | 'progress';
  skeletonType?: 'text' | 'card' | 'image' | 'custom';
  responsive?: boolean;
  widths?: number[];
  quality?: number;
  sizes?: string;
  critical?: boolean;
  blurDataURL?: string;
  rootMargin?: string;
  showProgress?: boolean;
}

// Progressive JPEG detection
const isProgressiveJpeg = (url: string): boolean => {
  return url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg');
};

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ 
    src, 
    alt, 
    className, 
    fallbackSrc, 
    showShimmer = true,
    shimmerVariant = 'blur-up', 
    skeletonType = 'image',
    responsive = true,
    widths = [400, 800, 1200],
    quality = 80,
    sizes,
    critical = false,
    blurDataURL,
    rootMargin = '200px',
    showProgress = false,
    ...props 
  }, ref) => {
    const [currentSrc, setCurrentSrc] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [formatIndex, setFormatIndex] = useState(0);
    const [shouldLoad, setShouldLoad] = useState(critical);
    const [showBlur, setShowBlur] = useState(!!blurDataURL);
    const [loadProgress, setLoadProgress] = useState(0);

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
    
    // Progressive loading progress simulation for large images
    useEffect(() => {
      if (!shouldLoad || !showProgress || !isLoading) return;
      
      const isLargeImage = isProgressiveJpeg(currentSrc);
      if (!isLargeImage) return;
      
      const progressInterval = setInterval(() => {
        setLoadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 100);
      
      return () => clearInterval(progressInterval);
    }, [shouldLoad, showProgress, isLoading, currentSrc]);

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
      setLoadProgress(0);
      
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
      setLoadProgress(100);
      
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
        setLoadProgress(0);
        imagePerformanceTracker.startLoading(nextUrl);
        return;
      }
      
      // If all formats failed and we have a fallback, use it
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setLoadProgress(0);
        imagePerformanceTracker.startLoading(fallbackSrc);
        return;
      }
      
      // If original URL wasn't tried yet, try it as final fallback
      if (currentSrc !== src) {
        setCurrentSrc(src);
        setLoadProgress(0);
        imagePerformanceTracker.startLoading(src);
        return;
      }
      
      // All fallbacks exhausted
      setIsLoading(false);
      setHasError(true);
      setShowBlur(false);
      setLoadProgress(0);
    }, [formatIndex, supportedFormats, src, fallbackSrc, currentSrc]);

    // Determine shimmer props based on variant
    const getShimmerProps = () => {
      switch (shimmerVariant) {
        case 'progress':
          return {
            variant: 'progress' as const,
            progress: loadProgress,
            className: cn("absolute inset-0 w-full h-full", className)
          };
        case 'blur-up':
          return {
            variant: 'blur-up' as const,
            blurDataURL: blurDataURL,
            className: cn("absolute inset-0 w-full h-full", className)
          };
        case 'skeleton':
          return {
            variant: 'skeleton' as const,
            skeletonType,
            className: cn("absolute inset-0 w-full h-full", className)
          };
        default:
          return {
            variant: 'default' as const,
            isShimmering: true,
            className: "absolute inset-0 w-full h-full"
          };
      }
    };

    return (
      <div 
        ref={intersectionRef}
        className={cn("relative overflow-hidden", className)}
      >
        {/* Enhanced shimmer loading states */}
        {isLoading && showShimmer && (
          <Shimmer {...getShimmerProps()} />
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