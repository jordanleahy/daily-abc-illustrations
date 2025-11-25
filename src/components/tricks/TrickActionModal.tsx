import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Trick } from '@/types/trick';
import { TrickGoalWithDetails } from '@/types/trick';
import { useAddTrickCompletion } from '@/hooks/useAddTrickCompletion';

interface TrickActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trick: Trick | null;
  goal: TrickGoalWithDetails | null;
}

export const TrickActionModal = ({ open, onOpenChange, trick, goal }: TrickActionModalProps) => {
  const addCompletion = useAddTrickCompletion();

  if (!trick) return null;

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

  const handleSuccess = () => {
    if (!goal) return;
    
    addCompletion.mutate({
      goalId: goal.id,
      count_increment: 1,
      notes: 'Success',
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleFailed = () => {
    if (!goal) return;
    
    addCompletion.mutate({
      goalId: goal.id,
      count_increment: 1,
      notes: 'Failed attempt',
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const hasGoal = !!goal;
  const isCompleted = goal && goal.current_count >= goal.target_count;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          {displayImage && (
            <div className="w-full h-48 overflow-hidden rounded-lg mb-4 -mt-6 -mx-6">
              <img 
                src={displayImage} 
                alt={trick.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <AlertDialogTitle className="text-xl">{trick.name}</AlertDialogTitle>
          {trick.description && (
            <AlertDialogDescription className="text-left whitespace-pre-line">
              {trick.description}
            </AlertDialogDescription>
          )}
          {goal && (
            <div className="text-sm text-muted-foreground">
              Progress: {goal.current_count} / {goal.target_count} completions
            </div>
          )}
        </AlertDialogHeader>

        {!hasGoal ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No active goal for this trick. Ask your parent to set up a goal!
            </p>
          </div>
        ) : isCompleted ? (
          <div className="text-center py-4">
            <p className="text-sm font-medium text-primary">
              🎉 Goal Completed!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-2">
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
        )}

        {trick.points_per_completion > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            +{trick.points_per_completion} coins per success
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
