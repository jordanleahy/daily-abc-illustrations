import { memo } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import type { SuggestedAction } from '@/hooks/useGoogleChat';

interface ImageButtonProps {
  action: SuggestedAction;
  imageSrc: string;
  altText: string;
  size?: number;
  onClick: () => void;
}

export const ImageButton = memo(({ 
  action, 
  imageSrc, 
  altText, 
  size = 160,
  onClick 
}: ImageButtonProps) => {
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
        "cursor-pointer rounded-lg overflow-hidden",
        "transition-all duration-200",
        "hover:scale-105 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "active:scale-95"
      )}
      style={{ width: `${size}px` }}
      aria-label={action.label}
    >
      <AspectRatio ratio={1}>
        <img
          src={imageSrc}
          alt={altText}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
      </AspectRatio>
    </div>
  );
});

ImageButton.displayName = 'ImageButton';
