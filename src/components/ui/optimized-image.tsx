import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { optimizeImageUrl, generateSrcSet, generateBlurPlaceholder } from '@/utils/imageOptimization';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
  alt: string;
  fallback?: React.ReactNode;
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
  containerClassName,
  className,
  width = 600,
  srcSetSizes = [400, 600, 800],
  priority = false,
  quality = 75,
  ...props
}: OptimizedImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!src) {
    return fallback ? <>{fallback}</> : null;
  }

  const fullImageUrl = optimizeImageUrl(src, { width, quality });

  // Preload critical images using native browser API
  useEffect(() => {
    if (priority && fullImageUrl) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = fullImageUrl;
      link.fetchPriority = 'high';
      
      // Add image format hints for better optimization
      if (fullImageUrl.includes('format=webp')) {
        link.type = 'image/webp';
      } else if (fullImageUrl.includes('format=avif')) {
        link.type = 'image/avif';
      }
      
      document.head.appendChild(link);
      
      return () => {
        // Cleanup preload link
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      };
    }
  }, [priority, fullImageUrl]);

  return (
    <div className={cn("relative w-full h-full overflow-hidden", containerClassName)}>
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
          src={fullImageUrl}
          srcSet={generateSrcSet(src, srcSetSizes)}
          sizes={props.sizes || "(max-width: 768px) 100vw, 600px"}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          decoding="async"
          className={cn("w-full h-full object-cover", className)}
          onLoad={() => setImageLoaded(true)}
          {...props}
        />
      </div>
    </div>
  );
};
