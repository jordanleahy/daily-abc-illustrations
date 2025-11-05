import { memo, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Shimmer } from '@/components/ui/shimmer';
import { cn } from '@/lib/utils';
import type { SuggestedAction } from '@/hooks/useGoogleChat';

interface ImageButtonProps {
  action: SuggestedAction;
  imageSrc: string;
  altText: string;
  onClick: () => void;
}

export const ImageButton = memo(({ 
  action, 
  imageSrc, 
  altText,
  onClick 
}: ImageButtonProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full cursor-pointer rounded-lg overflow-hidden",
        "transition-all duration-200",
        "hover:scale-105 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "active:scale-95"
      )}
      aria-label={action.label}
    >
      <AspectRatio ratio={1}>
        <div className="relative w-full h-full">
          {!imageLoaded && !imageError && (
            <Shimmer className="absolute inset-0" isShimmering={true} />
          )}
          <img
            src={imageSrc}
            alt={altText}
            className={cn(
              "h-full w-full object-cover transition-all duration-500 ease-out",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              setImageError(true);
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
      </AspectRatio>
    </div>
  );
});

ImageButton.displayName = 'ImageButton';
