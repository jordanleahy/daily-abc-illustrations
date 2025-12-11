/**
 * ⚠️ CRITICAL COMPONENT - DO NOT REPLACE WITH PLAIN <img> TAGS
 * 
 * This component provides 75-85% bandwidth savings through:
 * - Automatic image optimization (WebP/AVIF conversion)
 * - Service worker caching for instant repeat loads
 * - Responsive srcSet generation
 * - Skeleton-first loading with gradient placeholders
 * - Performance monitoring integration
 * 
 * See: docs/IMAGE_OPTIMIZATION_ARCHITECTURE.md
 * 
 * ALWAYS use this component for Supabase storage images.
 * DO NOT create duplicate image components.
 */

import { useState } from 'react';
import { Eye, EyeOff, BookOpen, Copy, Check } from 'lucide-react';
import { optimizeImageUrl, generateSrcSet } from '@/utils/imageOptimization';
import { createImageLoadTracker } from '@/utils/performanceMonitoring';
import { WordDetailView } from '@/components/reading/WordDetailView';
import { copyImageToClipboard } from '@/utils/clipboardHelpers';
import { useToast } from '@/hooks/use-toast';
import type { WordMetadata } from '@/utils/wordParser';

interface BookImageProps {
  src: string | undefined;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  enableMobileSave?: boolean;
  disableHoverEffects?: boolean;
  /** Enable parent toggle to hide/show image (tap once to reveal eye, tap eye to toggle) */
  enableVisibilityToggle?: boolean;
  /** Enable copy image button that copies actual image data to clipboard */
  enableCopyButton?: boolean;
  /** Current word metadata for word detail view */
  currentWordData?: WordMetadata;
}

/**
 * Unified image component for all book images across the app
 * Handles optimization, responsive srcSet, loading states, gradient placeholder, and performance tracking
 */
export function BookImage({
  src,
  alt,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 800px",
  onLoad,
  onError,
  enableMobileSave = false,
  disableHoverEffects = false,
  enableVisibilityToggle = false,
  enableCopyButton = false,
  currentWordData,
}: BookImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasBeenTapped, setHasBeenTapped] = useState(false);
  const [isImageHidden, setIsImageHidden] = useState(false);
  const [showWordDetail, setShowWordDetail] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const { toast } = useToast();
  
  // Runtime validation (development only)
  if (process.env.NODE_ENV === 'development') {
    if (!alt) {
      console.warn('[BookImage] Missing alt text:', src);
    }
  }
  
  if (!src) {
    return (
      <div className={`bg-gradient-to-br from-muted via-muted/50 to-muted ${className}`} />
    );
  }

  const optimizedUrl = optimizeImageUrl(src, { width: 800, quality: 85 });
  const srcSet = generateSrcSet(src, [400, 800, 1200]);
  
  // PHASE 4: Create performance tracker for this image
  const performanceTracker = createImageLoadTracker(optimizedUrl || src);
  
  // Runtime check: Warn if image URL is not optimized (development only)
  if (process.env.NODE_ENV === 'development' && src?.includes('supabase.co/storage')) {
    if (!optimizedUrl?.includes('width=') || !optimizedUrl?.includes('quality=')) {
      console.warn('[BookImage] Image URL not properly optimized:', src);
    }
  }

  // Toggle eye icon visibility on container tap
  const handleContainerTap = () => {
    if (enableVisibilityToggle) {
      setHasBeenTapped(prev => !prev);
    }
  };

  // Toggle visibility when eye icon is tapped
  const handleToggleVisibility = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsImageHidden(prev => !prev);
  };

  // Toggle word detail view when book icon is tapped
  const handleToggleWordDetail = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setShowWordDetail(prev => !prev);
  };

  // Copy image to clipboard
  const handleCopyImage = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!src || isCopyingImage) return;
    
    setIsCopyingImage(true);
    try {
      await copyImageToClipboard(src);
      setImageCopied(true);
      toast({ title: "Image copied to clipboard" });
      setTimeout(() => setImageCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
      toast({ 
        title: "Failed to copy image", 
        description: "Try long-pressing the image instead",
        variant: "destructive" 
      });
    } finally {
      setIsCopyingImage(false);
    }
  };

  return (
    <div 
      className="relative w-full h-full"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onClick={handleContainerTap}
    >
      {/* Gradient placeholder - prevents layout shift, fades out when image loads */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-muted via-muted/50 to-muted"
        style={{ 
          opacity: imageLoaded ? 0 : 1,
          transition: 'opacity 300ms ease-out'
        }}
      />
      
      {/* Main image with crossfade and visibility toggle */}
      <div
        className="absolute inset-0"
        style={{
          opacity: imageLoaded && !isImageHidden && !showWordDetail ? 1 : 0,
          transition: 'opacity 300ms ease-out'
        }}
      >
        <img
          src={optimizedUrl || src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          crossOrigin="anonymous"
          data-optimized="true"
          className={`transition-all duration-300 ease-out ${disableHoverEffects ? '' : 'hover:scale-110 hover:rotate-2'} ${className}`}
          style={{ 
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'default',
            touchAction: 'manipulation'
          }}
          onLoad={() => {
            setImageLoaded(true);
            performanceTracker.onLoad(); // Track performance
            onLoad?.();
          }}
          onError={() => {
            performanceTracker.onError(); // Track errors
            onError?.();
          }}
          onContextMenu={enableMobileSave ? (e) => {
            // Allow default context menu for mobile save
          } : undefined}
        />
      </div>

      {/* Hidden state placeholder - shows when image is hidden */}
      {enableVisibilityToggle && isImageHidden && imageLoaded && !showWordDetail && (
        <div 
          className="absolute inset-0 bg-muted/80 rounded-lg flex items-center justify-center"
          style={{ transition: 'opacity 300ms ease-out' }}
        >
          <EyeOff className="w-12 h-12 text-muted-foreground/40" />
        </div>
      )}

      {/* Word Detail View - shows when book icon is clicked and word data is available */}
      {showWordDetail && currentWordData && (
        <WordDetailView wordData={currentWordData} />
      )}

      {/* Control buttons - appear after first tap */}
      {(enableVisibilityToggle || enableCopyButton) && hasBeenTapped && imageLoaded && (
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {/* Copy button */}
          {enableCopyButton && (
            <button
              onClick={handleCopyImage}
              disabled={isCopyingImage}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white shadow-lg transition-all duration-200 hover:bg-black/70 active:scale-95 disabled:opacity-50"
              aria-label="Copy image"
            >
              {imageCopied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          )}
          {/* Visibility toggle */}
          {enableVisibilityToggle && (
            <button
              onClick={handleToggleVisibility}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white shadow-lg transition-all duration-200 hover:bg-black/70 active:scale-95"
              aria-label={isImageHidden ? "Show image" : "Hide image"}
            >
              {isImageHidden ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          )}
          {/* Word detail toggle */}
          {currentWordData && (
            <button
              onClick={handleToggleWordDetail}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full backdrop-blur-sm text-white shadow-lg transition-all duration-200 active:scale-95 ${
                showWordDetail ? 'bg-primary/70 hover:bg-primary/80' : 'bg-black/50 hover:bg-black/70'
              }`}
              aria-label={showWordDetail ? "Hide word details" : "Show word details"}
            >
              <BookOpen className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
