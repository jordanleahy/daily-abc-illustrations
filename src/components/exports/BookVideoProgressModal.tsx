import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { BookVideoProgress } from '@/services/bookVideoGenerator';

interface BookVideoProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  progress: BookVideoProgress | null;
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getPhaseLabel(phase: BookVideoProgress['phase'], progress?: BookVideoProgress | null): string {
  switch (phase) {
    case 'preparing':
      return 'Preparing...';
    case 'prefetching':
      return `Loading resources (${progress?.currentPage ?? 0}/${progress?.totalPages ?? 0})...`;
    case 'generating':
      return `Recording page ${progress?.currentPage ?? 0} of ${progress?.totalPages ?? 0}`;
    case 'complete':
      return 'Complete!';
    case 'cancelled':
      return 'Cancelled';
    case 'error':
      return 'Error';
    default:
      return 'Processing...';
  }
}

export function BookVideoProgressModal({
  isOpen,
  onClose,
  onCancel,
  progress,
}: BookVideoProgressModalProps) {
  const isComplete = progress?.phase === 'complete';
  const isError = progress?.phase === 'error';
  const isCancelled = progress?.phase === 'cancelled';
  const canClose = isComplete || isError || isCancelled;

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => !canClose && e.preventDefault()}
        onEscapeKeyDown={(e) => !canClose && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : isError ? (
              <AlertCircle className="w-5 h-5 text-destructive" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
            <span>
              {isComplete 
                ? 'Video Generated!' 
                : isError 
                  ? 'Generation Failed' 
                  : 'Generating Book Video'
              }
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phase indicator */}
          <div className="text-sm text-muted-foreground text-center">
            {progress && getPhaseLabel(progress.phase, progress)}
          </div>

          {/* Current page info */}
          {progress?.phase === 'generating' && progress.currentLetter && (
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-primary">
                Letter {progress.currentLetter}
              </div>
              {progress.currentPageTitle && (
                <div className="text-sm text-muted-foreground">
                  {progress.currentPageTitle}
                </div>
              )}
            </div>
          )}

          {/* Page progress */}
          {progress && progress.phase === 'generating' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Page {progress.currentPage} of {progress.totalPages}</span>
                <span>{Math.round(progress.pageProgress)}%</span>
              </div>
              <Progress value={progress.pageProgress} className="h-2" />
            </div>
          )}

          {/* Overall progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Overall Progress</span>
                <span>{Math.round(progress.overallProgress)}%</span>
              </div>
              <Progress value={progress.overallProgress} className="h-3" />
            </div>
          )}

          {/* Time remaining */}
          {progress?.estimatedTimeRemaining !== undefined && progress.phase === 'generating' && (
            <div className="text-center text-sm text-muted-foreground">
              Estimated time remaining: {formatTime(progress.estimatedTimeRemaining)}
            </div>
          )}

          {/* Error message */}
          {progress?.error && (
            <div className="text-center text-sm text-destructive">
              {progress.error}
            </div>
          )}

          {/* Success message */}
          {isComplete && (
            <div className="text-center text-sm text-muted-foreground">
              Your book video has been downloaded!
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {canClose ? (
            <Button onClick={onClose}>
              Close
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onCancel}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
