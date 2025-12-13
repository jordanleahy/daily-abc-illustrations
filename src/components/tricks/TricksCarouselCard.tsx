import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Trick, TrickGoalWithDetails } from '@/types/trick';

interface TricksCarouselCardProps {
  trick: Trick;
  goals: TrickGoalWithDetails[]; // Changed from single goal to array
  onClick: () => void;
}

export const TricksCarouselCard = memo(({ trick, goals, onClick }: TricksCarouselCardProps) => {
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

  // Format title: "{name} {feature_angle} {type}" all lowercase
  const formattedTitle = [
    trick.name,
    trick.feature_angle?.toLowerCase(),
    trick.type?.toLowerCase()
  ]
    .filter(Boolean)
    .join(' ');

  // Find goals by stance
  const regularGoal = goals.find(g => g.stance === 'regular');
  const switchGoal = goals.find(g => g.stance === 'switch');
  const hasRegular = !!regularGoal;
  const hasSwitch = !!switchGoal;

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
            {formattedTitle}
          </h3>
          {/* Show stance badges if practiced */}
          {(hasRegular || hasSwitch) && (
            <div className="flex gap-1">
              {hasRegular && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                  R: {regularGoal.current_count}/{regularGoal.target_count}
                </span>
              )}
              {hasSwitch && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary/50 text-secondary-foreground">
                  S: {switchGoal.current_count}/{switchGoal.target_count}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

TricksCarouselCard.displayName = 'TricksCarouselCard';
