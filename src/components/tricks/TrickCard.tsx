import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Edit2, Trash2, Video } from 'lucide-react';
import { Trick, TrickGoalWithDetails } from '@/types/trick';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface TrickCardProps {
  trick: Trick;
  goals: TrickGoalWithDetails[];
  onEdit: (trick: Trick) => void;
  onDelete: (trickId: string) => void;
}

export function TrickCard({ trick, goals, onEdit, onDelete }: TrickCardProps) {
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

  const hasVideos = (() => {
    const videoUrls = trick.video_urls;
    if (!videoUrls) return false;
    
    try {
      const urls = JSON.parse(videoUrls);
      return Array.isArray(urls) && urls.length > 0;
    } catch {
      return !!videoUrls;
    }
  })();

  return (
    <Card className="p-6">
      {displayImage && (
        <div className="mb-4 -mt-6 -mx-6 relative">
          <img 
            src={displayImage} 
            alt={trick.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          {hasVideos && (
            <Badge className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm">
              <Video className="h-3 w-3 mr-1" />
              Has Videos
            </Badge>
          )}
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{trick.name}</h3>
          {trick.feature_angle && (
            <p className="text-sm text-muted-foreground mt-1">Feature Angle: {trick.feature_angle}</p>
          )}
          {trick.type && (
            <p className="text-sm text-muted-foreground">Type: {trick.type}</p>
          )}
          {trick.description && (
            <p className="text-sm text-muted-foreground mt-1">{trick.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {trick.points_per_completion} {trick.points_per_completion === 1 ? 'coin' : 'coins'} per completion
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(trick)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(trick.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active goals</p>
        ) : (
          goals.map((goal) => {
            const progress = Math.round((goal.current_count / goal.target_count) * 100);
            const kidProfile = goal.kid_profiles;
            
            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={kidProfile?.profile_image_url || undefined} />
                    <AvatarFallback>
                      {kidProfile?.first_name?.[0]}{kidProfile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {kidProfile?.first_name}
                  </span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {goal.current_count}/{goal.target_count}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                {goal.goal_completed_at && (
                  <p className="text-xs text-green-600">✓ Goal completed!</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
