import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { TrickGoalWithDetails } from '@/types/trick';
import { useAddTrickCompletion } from '@/hooks/useAddTrickCompletion';
import { cn } from '@/lib/utils';
import { TrickMediaUploadButton } from './TrickMediaUploadButton';

interface TrickTrackingCardProps {
  goal: TrickGoalWithDetails;
}

export function TrickTrackingCard({ goal }: TrickTrackingCardProps) {
  const addCompletion = useAddTrickCompletion();
  const progressPercentage = (goal.current_count / goal.target_count) * 100;
  const isCompleted = goal.current_count >= goal.target_count;
  
  // Parse photo_url JSON array and use first image
  const displayImage = (() => {
    const photoUrl = goal.tricks?.photo_url;
    if (!photoUrl) return null;
    
    try {
      const urls = JSON.parse(photoUrl);
      return Array.isArray(urls) && urls.length > 0 ? urls[0] : null;
    } catch {
      // If it's not JSON, treat as single URL
      return photoUrl;
    }
  })();

  const handleSuccess = () => {
    addCompletion.mutate({
      goalId: goal.id,
      count_increment: 1,
      notes: 'Success',
    });
  };

  const handleFailed = () => {
    addCompletion.mutate({
      goalId: goal.id,
      count_increment: 0,
      notes: 'Failed attempt',
    });
  };

  return (
    <Card className={cn(
      'transition-all',
      isCompleted && 'border-primary bg-primary/5'
    )}>
      {displayImage && (
        <div className="w-full h-48 overflow-hidden rounded-t-lg">
          <img 
            src={displayImage} 
            alt={goal.tricks?.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{goal.tricks?.name}</CardTitle>
        {goal.tricks?.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {goal.tricks.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {goal.current_count} / {goal.target_count}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {!isCompleted && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={handleSuccess}
                disabled={addCompletion.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <ThumbsUp className="mr-2 h-5 w-5" />
                Success
              </Button>
              <Button
                onClick={handleFailed}
                disabled={addCompletion.isPending}
                variant="destructive"
                size="lg"
              >
                <ThumbsDown className="mr-2 h-5 w-5" />
                Failed
              </Button>
            </div>
            
            <div className="flex justify-center">
              <TrickMediaUploadButton
                trickId={goal.trick_id}
                kidProfileId={goal.kid_profile_id}
              />
            </div>
          </>
        )}

        {isCompleted && (
          <div className="text-center py-2">
            <p className="text-sm font-medium text-primary">
              🎉 Goal Completed!
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          +{goal.tricks?.points_per_completion} coins per success
        </div>
      </CardContent>
    </Card>
  );
}
