import { useState } from 'react';
import { usePublicPageImage } from '@/hooks/usePublicPageImage';
import { BookImage } from '@/components/ui/book-image';
import { Button } from '@/components/ui/button';
import { Camera, Eye, EyeOff } from 'lucide-react';
import { getImageAspect } from '@/config/imageAspects';

interface PublicPageImageProps {
  pageId: string;
  bookId: string;
  className?: string;
  /** Show upload button overlay for authenticated users */
  showUploadButton?: boolean;
  /** Handler when upload button is clicked */
  onUploadClick?: () => void;
  /** If true, prioritizes loading */
  isFirstImage?: boolean;
  /** Disable hover effects (zoom/rotate) for reading mode */
  disableHoverEffects?: boolean;
  /** Enable parent toggle to hide/show image */
  enableVisibilityToggle?: boolean;
}

export function PublicPageImage({ 
  pageId, 
  bookId, 
  className = "",
  showUploadButton = false,
  onUploadClick,
  isFirstImage = false,
  disableHoverEffects = false,
  enableVisibilityToggle = false
}: PublicPageImageProps) {
  const { data: imageData, isLoading } = usePublicPageImage(pageId);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const [isImageHidden, setIsImageHidden] = useState(false);

  // Handle first tap to reveal eye icon, subsequent taps do nothing on image area
  const handleImageTap = () => {
    if (enableVisibilityToggle && !hasBeenTapped) {
      setHasBeenTapped(true);
    }
  };

  // Toggle visibility when eye icon is tapped
  const handleToggleVisibility = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsImageHidden(prev => !prev);
  };

  return (
    <div 
      className={`relative w-full ${getImageAspect('book-page')} group`}
      onClick={handleImageTap}
    >
      {/* Gradient placeholder - prevents layout shift */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-lg"
        style={{ 
          opacity: imageLoaded ? 0 : 1,
          transition: 'opacity 300ms ease-out'
        }}
      />
      
      {/* Main image with crossfade and visibility toggle */}
      <div
        className="absolute inset-0"
        style={{
          opacity: imageLoaded && !isImageHidden ? 1 : 0,
          transition: 'opacity 300ms ease-out'
        }}
      >
        <BookImage
          src={imageData?.image_url}
          alt="Page illustration"
          priority={isFirstImage}
          className={`w-full h-full object-contain ${className}`}
          onLoad={() => setImageLoaded(true)}
          disableHoverEffects={disableHoverEffects}
        />
      </div>

      {/* Hidden state placeholder - shows when image is hidden */}
      {isImageHidden && imageLoaded && (
        <div 
          className="absolute inset-0 bg-muted/80 rounded-lg flex items-center justify-center"
          style={{
            opacity: 1,
            transition: 'opacity 300ms ease-out'
          }}
        >
          <EyeOff className="w-12 h-12 text-muted-foreground/40" />
        </div>
      )}

      {/* Eye icon toggle - appears after first tap */}
      {enableVisibilityToggle && hasBeenTapped && imageLoaded && (
        <button
          onClick={handleToggleVisibility}
          className="absolute top-3 left-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white shadow-lg transition-all duration-200 hover:bg-black/70 active:scale-95 z-10"
          aria-label={isImageHidden ? "Show image" : "Hide image"}
        >
          {isImageHidden ? (
            <Eye className="w-5 h-5" />
          ) : (
            <EyeOff className="w-5 h-5" />
          )}
        </button>
      )}
      
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