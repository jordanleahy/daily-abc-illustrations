import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Trick, VideoData, TrickStance } from '@/types/trick';
import { TrickGoalWithDetails } from '@/types/trick';
import { useAddTrickCompletion } from '@/hooks/useAddTrickCompletion';
import { TrickMediaViewer } from './TrickMediaViewer';
import { TrickUploadZone } from './TrickUploadZone';

interface TrickActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trick: Trick | null;
  goals: TrickGoalWithDetails[]; // Changed from single goal to array
}

export const TrickActionModal = ({ open, onOpenChange, trick, goals }: TrickActionModalProps) => {
  const [selectedStance, setSelectedStance] = useState<TrickStance>('regular');
  const addCompletion = useAddTrickCompletion();

  const images = useMemo(() => {
    if (!trick) return [];
    const photoUrl = trick.photo_url;
    if (!photoUrl) return [];
    
    try {
      const urls = JSON.parse(photoUrl);
      return Array.isArray(urls) ? urls : [photoUrl];
    } catch {
      return [photoUrl];
    }
  }, [trick?.photo_url]);

  const videos = useMemo(() => {
    if (!trick) return [];
    const videoUrls = trick.video_urls;
    if (!videoUrls) return [];
    
    try {
      const parsed = JSON.parse(videoUrls);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object' && 'dataUrl' in parsed[0]) {
          return (parsed as VideoData[]).map(v => v.dataUrl);
        }
        return parsed as string[];
      }
      return [videoUrls];
    } catch {
      return [videoUrls];
    }
  }, [trick?.video_urls]);

  // Find goals by stance (fallback to first goal as 'regular' if stance not set)
  const regularGoal = useMemo(() => 
    goals.find(g => g.trick_id === trick?.id && (g.stance === 'regular' || !g.stance)),
    [goals, trick?.id]
  );
  
  const switchGoal = useMemo(() => 
    goals.find(g => g.trick_id === trick?.id && g.stance === 'switch'),
    [goals, trick?.id]
  );
  
  const currentGoal = selectedStance === 'regular' ? regularGoal : switchGoal;

  if (!trick) return null;

  const handleSuccess = () => {
    if (!currentGoal) return;
    
    addCompletion.mutate({
      goalId: currentGoal.id,
      count_increment: 1,
      notes: `Success (${selectedStance})`,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const handleFailed = () => {
    if (!currentGoal) return;
    
    addCompletion.mutate({
      goalId: currentGoal.id,
      count_increment: 1,
      notes: `Failed attempt (${selectedStance})`,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const isCompleted = currentGoal && currentGoal.current_count >= currentGoal.target_count;
  const hasAnyGoal = regularGoal || switchGoal;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-6">
        {(images.length > 0 || videos.length > 0) && (
          <div className="w-full mb-4">
            <TrickMediaViewer images={images} videos={videos} />
          </div>
        )}
        
        <DrawerHeader>
          <DrawerTitle className="text-xl">{trick.name}</DrawerTitle>
          <div className="text-left space-y-1">
            {trick.feature_angle && (
              <DrawerDescription className="text-sm">
                Feature Angle: {trick.feature_angle}
              </DrawerDescription>
            )}
            {trick.type && (
              <DrawerDescription className="text-sm">
                Type: {trick.type}
              </DrawerDescription>
            )}
            {trick.description && (
              <DrawerDescription>
                {trick.description}
              </DrawerDescription>
            )}
          </div>
        </DrawerHeader>

        {/* Stance Toggle - Always visible */}
        <div className="flex gap-2 px-4 py-3 bg-muted/50 rounded-lg mx-4 mb-2">
          <Button
            variant={selectedStance === 'regular' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setSelectedStance('regular')}
          >
            Regular
            {regularGoal && (
              <span className="ml-1 text-xs opacity-70">
                ({regularGoal.current_count}/{regularGoal.target_count})
              </span>
            )}
          </Button>
          <Button
            variant={selectedStance === 'switch' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setSelectedStance('switch')}
          >
            Switch
            {switchGoal && (
              <span className="ml-1 text-xs opacity-70">
                ({switchGoal.current_count}/{switchGoal.target_count})
              </span>
            )}
          </Button>
        </div>

        {/* Progress Display */}
        {currentGoal && (
          <div className="text-sm text-muted-foreground px-4 pb-2">
            Progress: {currentGoal.current_count} / {currentGoal.target_count} completions
          </div>
        )}

        {!hasAnyGoal ? (
          <div className="text-center py-4 px-4">
            <p className="text-sm text-muted-foreground">
              No active goal for this trick. Ask your parent to set up a goal!
            </p>
          </div>
        ) : !currentGoal ? (
          <div className="text-center py-4 px-4">
            <p className="text-sm text-muted-foreground">
              Loading goal...
            </p>
          </div>
        ) : isCompleted ? (
          <div className="text-center py-4 px-4">
            <p className="text-sm font-medium text-primary">
              🎉 {selectedStance === 'regular' ? 'Regular' : 'Switch'} Goal Completed!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 py-2 px-4">
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
            
            <div className="px-4 py-2">
              <TrickUploadZone
                trickId={trick.id}
                goalId={currentGoal?.id}
                kidProfileId={currentGoal?.kid_profile_id}
                attemptNumber={currentGoal?.current_count}
              />
            </div>
          </>
        )}

        {trick.points_per_completion > 0 && (
          <div className="text-xs text-muted-foreground text-center px-4">
            +{trick.points_per_completion} coins per success
          </div>
        )}

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
