import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Shimmer } from './shimmer';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  showShimmer?: boolean;
}

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ src, alt, className, fallbackSrc, showShimmer = true, ...props }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = () => {
      // Try fallback if available and not already tried
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
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
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';