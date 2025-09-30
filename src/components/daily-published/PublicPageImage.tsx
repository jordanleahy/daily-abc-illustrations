import { useState } from 'react';
import { usePublicPageImage } from '@/hooks/usePublicPageImage';
import { Shimmer } from '@/components/ui/shimmer';
import { useResponsiveImageSize } from '@/hooks/useResponsiveImageSize';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';

interface PublicPageImageProps {
  pageId: string;
  bookId: string;
  className?: string;
}

export function PublicPageImage({ pageId, bookId, className = "" }: PublicPageImageProps) {
  const { data: imageData, isLoading } = usePublicPageImage(pageId);
  const { width, height } = useResponsiveImageSize();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const originalUrl = imageData?.image_url;
  const optimizedImageUrl = getOptimizedImageUrl(originalUrl, { width, height });
  const imgSrc = optimizedImageUrl || originalUrl;

  if (isLoading) {
    return <Shimmer className={`w-full h-full ${className}`} />;
  }

  if (!imgSrc) {
    return (
      <div className={`w-full h-full bg-muted/50 flex items-center justify-center ${className}`}>
        <div className="text-xs text-muted-foreground">No image</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!imageLoaded && (
        <Shimmer className={`absolute inset-0 ${className}`} />
      )}
      <img
        src={imgSrc}
        alt="Page illustration"
        loading="eager"
        className={`w-full h-full object-cover object-top transition-opacity duration-200 ${className} ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        decoding="async"
      />
    </div>
  );
}