import { useState } from 'react';
import { usePublicPageImage } from '@/hooks/usePublicPageImage';
import { BookImage } from '@/components/ui/book-image';
import { Button } from '@/components/ui/button';
import { Shimmer } from '@/components/ui/shimmer';
import { Camera } from 'lucide-react';

interface PublicPageImageProps {
  pageId: string;
  bookId: string;
  className?: string;
  /** Show upload button overlay for authenticated users */
  showUploadButton?: boolean;
  /** Handler when upload button is clicked */
  onUploadClick?: () => void;
  /** If true, shows full-screen loading guard (for first image only) */
  isFirstImage?: boolean;
}

export function PublicPageImage({ 
  pageId, 
  bookId, 
  className = "",
  showUploadButton = false,
  onUploadClick,
  isFirstImage = false
}: PublicPageImageProps) {
  const { data: imageData, isLoading } = usePublicPageImage(pageId);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Full-screen loading guard for first image
  if (isFirstImage && (!imageLoaded || isLoading)) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <Shimmer 
          isShimmering={true} 
          className="w-full h-full max-w-2xl max-h-[80vh] rounded-lg"
        >
          <BookImage
            src={imageData?.image_url}
            alt="Page illustration"
            priority={true}
            className="w-full h-full object-contain opacity-0"
            onLoad={() => setImageLoaded(true)}
          />
        </Shimmer>
      </div>
    );
  }

  // Normal loading state for subsequent images
  if (isLoading) {
    return (
      <div className={`w-full h-full ${className}`}>
        <BookImage src={undefined} alt="Loading..." priority={true} className={className} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <BookImage
        src={imageData?.image_url}
        alt="Page illustration"
        priority={isFirstImage}
        className={`w-full h-full object-contain ${className}`}
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Upload button overlay */}
      {showUploadButton && onUploadClick && imageLoaded && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
          <Button
            variant="secondary"
            size="icon"
            onClick={onUploadClick}
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
            aria-label="Upload custom image"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}