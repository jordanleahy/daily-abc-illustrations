import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Shimmer } from './shimmer';
import { getSupportedImageFormat, buildOptimizedImageUrl } from '@/utils/imageOptimization';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  showShimmer?: boolean;
}

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ src, alt, className, fallbackSrc, showShimmer = true, ...props }, ref) => {
    const [currentSrc, setCurrentSrc] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [formatIndex, setFormatIndex] = useState(0);

    // Get supported formats in priority order (AVIF > WebP > PNG)
    const supportedFormats = getSupportedImageFormat();
    
    useEffect(() => {
      // Reset states when src changes
      setIsLoading(true);
      setHasError(false);
      setFormatIndex(0);
      
      // Start with the best supported format
      const initialUrl = buildOptimizedImageUrl(src, supportedFormats[0]);
      setCurrentSrc(initialUrl);
    }, [src, supportedFormats]);

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = () => {
      const nextFormatIndex = formatIndex + 1;
      
      // Try next format if available
      if (nextFormatIndex < supportedFormats.length) {
        setFormatIndex(nextFormatIndex);
        const nextUrl = buildOptimizedImageUrl(src, supportedFormats[nextFormatIndex]);
        setCurrentSrc(nextUrl);
        return;
      }
      
      // If all formats failed and we have a fallback, use it
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        return;
      }
      
      // If original URL wasn't tried yet, try it as final fallback
      if (currentSrc !== src) {
        setCurrentSrc(src);
        return;
      }
      
      // All fallbacks exhausted
      setIsLoading(false);
      setHasError(true);
    };

    return (
      <div className={cn("relative overflow-hidden", className)}>
        {/* Show shimmer while loading if enabled */}
        {isLoading && showShimmer && (
          <Shimmer className="absolute inset-0 w-full h-full" />
        )}
        
        {/* Show error state */}
        {hasError && (
          <div className="absolute inset-0 w-full h-full bg-muted/50 flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Failed to load image</div>
          </div>
        )}
        
        {/* Actual image */}
        {currentSrc && (
          <img
            ref={ref}
            src={currentSrc}
            alt={alt}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            {...props}
          />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';