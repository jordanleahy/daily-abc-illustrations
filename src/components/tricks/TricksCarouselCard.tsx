import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Trick } from '@/types/trick';

interface TricksCarouselCardProps {
  trick: Trick;
  onClick: () => void;
}

export const TricksCarouselCard = memo(({ trick, onClick }: TricksCarouselCardProps) => {
  const displayImage = (() => {
    const photoUrl = trick.photo_url;
    if (!photoUrl) return null;
    
    try {
      const urls = JSON.parse(photoUrl);
      return Array.isArray(urls) && urls.length > 0 ? urls[0] : null;
    } catch {
      return photoUrl;
    }
  })();

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <AspectRatio ratio={1/1} className="shadow-md hover:shadow-xl transition-shadow duration-300">
          {displayImage ? (
            <img
              src={displayImage}
              alt={trick.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-4xl">🏂</span>
            </div>
          )}
        </AspectRatio>
        <div className="p-4 space-y-1">
          <h3 className="font-semibold text-sm line-clamp-2">
            {trick.name}
          </h3>
          {trick.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {trick.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

TricksCarouselCard.displayName = 'TricksCarouselCard';
