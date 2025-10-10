import { useState } from 'react';
import { usePublicPageImage } from '@/hooks/usePublicPageImage';
import { Shimmer } from '@/components/ui/shimmer';
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
}

export function PublicPageImage({ 
  pageId, 
  bookId, 
  className = "",
  showUploadButton = false,
  onUploadClick
}: PublicPageImageProps) {
  const { data: imageData, isLoading } = usePublicPageImage(pageId);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Add Supabase image transformations for mobile optimization
  const optimizeImageUrl = (url: string | undefined): string | undefined => {
    if (!url || !url.includes('supabase.co/storage')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=800&quality=80&format=webp`;
  };
  
  const imageUrl = optimizeImageUrl(imageData?.image_url);
  const originalUrl = imageData?.image_url;

  if (isLoading) {
    return <Shimmer className={`w-full h-full ${className}`} />;
  }

  if (!imageUrl) {
    return (
      <div className={`w-full h-full bg-muted/50 flex items-center justify-center ${className}`}>
        <div className="text-xs text-muted-foreground">No image</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      {!imageLoaded && (
        <Shimmer className={`absolute inset-0 ${className}`} />
      )}
      <img
        src={imageUrl}
        srcSet={originalUrl ? `${imageUrl} 800w, ${originalUrl} 1200w` : undefined}
        sizes="(max-width: 768px) 100vw, 800px"
        alt="Page illustration"
        loading="eager"
        fetchPriority="high"
        className={`w-full h-full object-cover object-top transition-opacity duration-200 ${className} ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
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