import { useState } from 'react';
import { cn } from '@/lib/utils';
import { optimizeImageUrl, generateSrcSet, generateBlurPlaceholder } from '@/utils/imageOptimization';
import { Shimmer } from './shimmer';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  alt: string;
  fallback?: React.ReactNode;
  shimmerClassName?: string;
  containerClassName?: string;
  width?: number;
  srcSetSizes?: number[];
  priority?: boolean;
  quality?: number;
}

export const OptimizedImage = ({
  src,
  alt,
  fallback,
  shimmerClassName,
  containerClassName,
  className,
  width = 600,
  srcSetSizes = [400, 600, 800],
  priority = false,
  quality = 75,
  ...props
}: OptimizedImageProps) => {
  const [blurLoaded, setBlurLoaded] = useState(false);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);

  if (!src) {
    return fallback ? <>{fallback}</> : null;
  }

  const blurPlaceholder = generateBlurPlaceholder(src);
  const fullImageUrl = optimizeImageUrl(src, { width, quality });

  return (
    <div className={cn("relative w-full h-full overflow-hidden", containerClassName)}>
      {/* Shimmer - shows until blur placeholder loads */}
      {!blurLoaded && (
        <Shimmer className={cn("absolute inset-0", shimmerClassName)} />
      )}
      
      {/* Blur placeholder - loads instantly (tiny 20px image) */}
      {blurPlaceholder && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden="true"
          loading="eager"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            blurLoaded && !fullImageLoaded ? "opacity-100 blur-xl scale-110" : "opacity-0"
          )}
          onLoad={() => setBlurLoaded(true)}
        />
      )}
      
      {/* Full resolution image */}
      <img
        src={fullImageUrl}
        srcSet={generateSrcSet(src, srcSetSizes)}
        sizes={props.sizes || "(max-width: 768px) 100vw, 600px"}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        decoding="async"
        className={cn(
          "relative w-full h-full object-cover transition-opacity duration-500",
          fullImageLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setFullImageLoaded(true)}
        {...props}
      />
    </div>
  );
};
