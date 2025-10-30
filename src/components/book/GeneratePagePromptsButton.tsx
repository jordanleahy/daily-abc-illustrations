import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useGenerateAllPagePrompts } from '@/hooks/useGenerateAllPagePrompts';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface GeneratePagePromptsButtonProps {
  bookId: string;
  pages: Array<{ id: string; letter: string; title: string }>;
}

export function GeneratePagePromptsButton({ bookId, pages }: GeneratePagePromptsButtonProps) {
  const { user } = useAuthContext();
  const { generateAllPagePrompts, isGenerating, progress, reset } = useGenerateAllPagePrompts();
  const [showDialog, setShowDialog] = useState(false);

  const handleGenerate = () => {
    if (!user?.id) return;

    setShowDialog(true);
    generateAllPagePrompts({
      bookId,
      userId: user.id,
      pages
    });
  };

  const handleClose = () => {
    setShowDialog(false);
    reset();
  };

  const progressPercentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <>
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || pages.length === 0}
        variant="default"
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Prompts...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate All Page Prompts
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generating Page Prompts</DialogTitle>
            <DialogDescription>
              Creating detailed, page-specific image prompts using the Graphics Designer Agent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress.current} / {progress.total}</span>
              </div>
              <Progress value={progressPercentage} />
            </div>

            {/* Current Page */}
            {progress.status === 'processing' && progress.currentPageTitle && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="font-medium mb-1">Currently processing:</div>
                <div className="text-muted-foreground">{progress.currentPageTitle}</div>
              </div>
            )}

            {/* Results Summary */}
            {progress.current > 0 && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                  <div className="text-muted-foreground">Success</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {progress.results.success}
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                  <div className="text-muted-foreground">Failed</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {progress.results.failed}
                  </div>
                </div>
              </div>
            )}

            {/* Failed Pages Details */}
            {progress.results.failedPages.length > 0 && (
              <div className="space-y-2">
                <div className="font-medium text-sm">Failed Pages:</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {progress.results.failedPages.map((failed) => (
                    <div key={failed.pageId} className="text-sm rounded bg-destructive/10 p-2">
                      <div className="font-medium">{failed.title}</div>
                      <div className="text-xs text-muted-foreground">{failed.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Message */}
            {progress.status === 'complete' && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-center">
                ✨ Page prompts generated! Images can now be created with consistent styling.
              </div>
            )}

            {/* Close Button */}
            {progress.status === 'complete' && (
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
