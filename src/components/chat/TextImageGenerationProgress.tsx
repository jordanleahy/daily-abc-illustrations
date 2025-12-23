import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Loader2, X, RefreshCw } from 'lucide-react';
import { TextImageProgress } from '@/hooks/useGenerateAllTextImages';

interface TextImageGenerationProgressProps {
  progress: TextImageProgress;
  onCancel: () => void;
  onRetryFailed: () => void;
  onClose: () => void;
}

export function TextImageGenerationProgress({
  progress,
  onCancel,
  onRetryFailed,
  onClose,
}: TextImageGenerationProgressProps) {
  const { current, total, status, currentPageLetter, failedPages, completedPages } = progress;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  if (status === 'idle') return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
      {/* Header with close for complete/cancelled states */}
      {(status === 'complete' || status === 'cancelled') && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Status Icon */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        status === 'processing' ? 'bg-primary/10' :
        status === 'complete' && failedPages.length === 0 ? 'bg-green-500/10' :
        status === 'complete' ? 'bg-yellow-500/10' :
        status === 'cancelled' ? 'bg-muted' :
        'bg-red-500/10'
      }`}>
        {status === 'processing' ? (
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        ) : status === 'complete' && failedPages.length === 0 ? (
          <CheckCircle className="h-8 w-8 text-green-600" />
        ) : status === 'complete' ? (
          <CheckCircle className="h-8 w-8 text-yellow-600" />
        ) : status === 'cancelled' ? (
          <X className="h-8 w-8 text-muted-foreground" />
        ) : (
          <XCircle className="h-8 w-8 text-red-600" />
        )}
      </div>

      {/* Title */}
      <p className="text-base font-semibold mb-2">
        {status === 'processing' ? 'Generating Text Images...' :
         status === 'complete' && failedPages.length === 0 ? 'All Done!' :
         status === 'complete' ? 'Completed with Errors' :
         status === 'cancelled' ? 'Generation Cancelled' :
         'Generation Failed'}
      </p>

      {/* Progress info */}
      {status === 'processing' && (
        <>
          <p className="text-sm text-muted-foreground mb-3">
            Processing page <span className="font-semibold text-foreground">{currentPageLetter}</span>
            {' '}({current} of {total})
          </p>
          <Progress value={percentage} className="w-full max-w-xs mb-4" />
        </>
      )}

      {/* Summary for complete/cancelled */}
      {(status === 'complete' || status === 'cancelled') && (
        <div className="text-sm text-muted-foreground mb-4 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            {completedPages.length} pages completed
          </p>
          {failedPages.length > 0 && (
            <p className="flex items-center justify-center gap-1">
              <XCircle className="h-4 w-4 text-red-600" />
              {failedPages.length} pages failed
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {status === 'processing' && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        
        {status === 'complete' && failedPages.length > 0 && (
          <Button variant="default" size="sm" onClick={onRetryFailed} className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Retry Failed
          </Button>
        )}
        
        {(status === 'complete' || status === 'cancelled') && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
