import { useState } from 'react';
import { usePublicPageImage } from '@/hooks/usePublicPageImage';
import { Shimmer } from '@/components/ui/shimmer';
import { useResponsiveImageSize } from '@/hooks/useResponsiveImageSize';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import { useIsMobile } from '@/hooks/use-mobile';

interface PublicPageImageProps {
  pageId: string;
  bookId: string;
  className?: string;
}

export function PublicPageImage({ pageId, bookId, className = "" }: PublicPageImageProps) {
  const { data: imageData, isLoading } = usePublicPageImage(pageId);
  const { width, height } = useResponsiveImageSize();
  const isMobile = useIsMobile();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Debug logging
  console.log('PublicPageImage render:', { pageId, bookId, imageData, isLoading });
  
  // Custom lazy loading with mobile-optimized threshold
  const { ref, inView } = useIntersectionObserver({
    rootMargin: isMobile ? '300px' : '500px',
    threshold: 0,
    triggerOnce: true,
  });

  const optimizedImageUrl = getOptimizedImageUrl(imageData?.image_url, {
    width,
    height,
  });
  
  console.log('Image state:', { inView, optimizedImageUrl, imageLoaded, imageError });

  if (isLoading) {
    return <Shimmer className={`w-full h-full ${className}`} />;
  }

  if (!optimizedImageUrl || imageError) {
    return (
      <div className={`w-full h-full bg-muted/50 flex items-center justify-center ${className}`}>
        <div className="text-xs text-muted-foreground">No image</div>
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full h-full">
      {!imageLoaded && (
        <Shimmer className={`w-full h-full ${className}`} />
      )}
      <img
        src={optimizedImageUrl}
        alt="Page illustration"
        loading="lazy"
        className={`w-full h-full object-cover object-top transition-opacity duration-300 ${className} ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        decoding="async"
      />
    </div>
  );
}