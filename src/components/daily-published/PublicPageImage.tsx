import { useState, useEffect } from 'react';
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
  const [imageError, setImageError] = useState(false);
  
  const originalUrl = imageData?.image_url;
  const optimizedImageUrl = getOptimizedImageUrl(originalUrl, { width, height });
  
  // Two-step fallback: try optimized first, then original
  const [imgSrc, setImgSrc] = useState(optimizedImageUrl ?? originalUrl);
  const [triedOriginal, setTriedOriginal] = useState(false);

  // Update image source when data changes
  useEffect(() => {
    setImgSrc(optimizedImageUrl ?? originalUrl);
    setTriedOriginal(false);
    setImageLoaded(false);
    setImageError(false);
  }, [optimizedImageUrl, originalUrl]);

  const handleImageError = () => {
    // Try original URL if we haven't already
    if (!triedOriginal && originalUrl && imgSrc !== originalUrl) {
      setTriedOriginal(true);
      setImgSrc(originalUrl);
      setImageLoaded(false);
    } else {
      // Both failed, show error
      setImageError(true);
    }
  };

  if (isLoading) {
    return <Shimmer className={`w-full h-full ${className}`} />;
  }

  if (!imgSrc || imageError) {
    return (
      <div className={`w-full h-full bg-muted/50 flex items-center justify-center ${className}`}>
        <div className="text-xs text-muted-foreground">No image</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {!imageLoaded && (
        <Shimmer className={`w-full h-full ${className}`} />
      )}
      <img
        src={imgSrc}
        alt="Page illustration"
        loading="eager"
        className={`w-full h-full object-cover object-top transition-opacity duration-300 ${className} ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={handleImageError}
        decoding="async"
      />
    </div>
  );
}