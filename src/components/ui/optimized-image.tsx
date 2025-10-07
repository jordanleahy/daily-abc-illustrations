import { useState } from 'react';
import { cn } from '@/lib/utils';
import { optimizeImageUrl, generateSrcSet } from '@/utils/imageOptimization';
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
}

export const OptimizedImage = ({
  src,
  alt,
  fallback,
  shimmerClassName,
  containerClassName,
  className,
  width = 800,
  srcSetSizes = [600, 800, 1200],
  priority = false,
  ...props
}: OptimizedImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!src) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className={cn("relative w-full h-full", containerClassName)}>
      {!imageLoaded && (
        <Shimmer className={cn("absolute inset-0", shimmerClassName)} />
      )}
      <img
        src={optimizeImageUrl(src, { width })}
        srcSet={generateSrcSet(src, srcSetSizes)}
        sizes={props.sizes || "(max-width: 768px) 100vw, 800px"}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "low"}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          imageLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setImageLoaded(true)}
        {...props}
      />
    </div>
  );
};
