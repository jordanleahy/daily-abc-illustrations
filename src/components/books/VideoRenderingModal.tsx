/**
 * VideoRenderingModal - Prevents navigation during video rendering
 * 
 * Displays a modal with progress and warning to keep screen active
 */

import { useEffect } from 'react';
import { Loader2, MonitorSmartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface VideoRenderingModalProps {
  isOpen: boolean;
  progress: number;
  phase: string;
  aspectLabel: string;
}

export function VideoRenderingModal({
  isOpen,
  progress,
  phase,
  aspectLabel,
}: VideoRenderingModalProps) {
  // Prevent navigation/closing while rendering
  useEffect(() => {
    if (!isOpen) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Video is still rendering. Leaving will cancel the render.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen]);

  const getPhaseLabel = (p: string): string => {
    switch (p) {
      case 'preparing':
        return 'Preparing...';
      case 'prefetching':
        return 'Loading assets...';
      case 'recording':
        return 'Recording video...';
      case 'saving':
        return 'Saving to cloud...';
      default:
        return 'Processing...';
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Generating {aspectLabel} Video
          </DialogTitle>
          <DialogDescription className="pt-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
              <MonitorSmartphone className="h-4 w-4" />
              Please keep this screen open
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{getPhaseLabel(phase)}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Navigating away or closing this screen will cancel the video rendering.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
