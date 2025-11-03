import { useState } from 'react';
import { usePublicPageImage } from '@/hooks/usePublicPageImage';
import { BookImage } from '@/components/ui/book-image';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface PublicPageImageProps {
  pageId: string;
  bookId: string;
  className?: string;
  /** Show upload button overlay for authenticated users */
  showUploadButton?: boolean;
  /** Handler when upload button is clicked */
  onUploadClick?: () => void;
  /** Text content to display in overlay (from Page.content.mainConcept) */
  pageContent?: string;
  /** Toggle to enable/disable text overlay */
  showTextOverlay?: boolean;
}

export function PublicPageImage({ 
  pageId, 
  bookId, 
  className = "",
  showUploadButton = false,
  onUploadClick,
  pageContent,
  showTextOverlay = false
}: PublicPageImageProps) {
  const { data: imageData, isLoading } = usePublicPageImage(pageId);
  const [imageLoaded, setImageLoaded] = useState(false);

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
        priority={true}
        className={`w-full h-full object-cover object-top ${className}`}
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Text overlay with dark gradient background */}
      {showTextOverlay && pageContent && imageLoaded && (
        <div 
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)',
            paddingTop: '4rem',
            paddingBottom: '2rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem'
          }}
        >
          <p 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center pointer-events-auto select-text leading-tight"
            style={{ 
              textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)' 
            }}
          >
            {pageContent}
          </p>
        </div>
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