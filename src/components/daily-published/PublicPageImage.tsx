import { useState } from 'react';
import { usePublicPageImage } from '@/hooks/usePublicPageImage';
import { BookImage } from '@/components/ui/book-image';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { getImageAspect } from '@/config/imageAspects';
import type { WordMetadata } from '@/utils/wordParser';

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
  /** Current word metadata for word detail view */
  currentWordData?: WordMetadata;
  /** Callback for audio/TTS button */
  onAudioClick?: () => void;
  /** Callback for video/download button */
  onVideoClick?: () => void;
  /** Whether audio is currently playing */
  isAudioPlaying?: boolean;
  /** Whether video export is in progress */
  isVideoExporting?: boolean;
}

export function PublicPageImage({ 
  pageId, 
  bookId, 
  className = "",
  showUploadButton = false,
  onUploadClick,
  isFirstImage = false,
  disableHoverEffects = false,
  enableVisibilityToggle = false,
  currentWordData,
  onAudioClick,
  onVideoClick,
  isAudioPlaying,
  isVideoExporting,
}: PublicPageImageProps) {
  const { data: imageData, isLoading } = usePublicPageImage(pageId);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={`relative w-full ${getImageAspect('book-page')} group`}>
      {/* Gradient placeholder - prevents layout shift */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-lg"
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
        <BookImage
          src={imageData?.image_url}
          alt="Page illustration"
          priority={isFirstImage}
          className={`w-full h-full object-contain ${className}`}
          onLoad={() => setImageLoaded(true)}
          disableHoverEffects={disableHoverEffects}
          enableVisibilityToggle={enableVisibilityToggle}
          currentWordData={currentWordData}
          onAudioClick={onAudioClick}
          onVideoClick={onVideoClick}
          isAudioPlaying={isAudioPlaying}
          isVideoExporting={isVideoExporting}
        />
      </div>
      
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