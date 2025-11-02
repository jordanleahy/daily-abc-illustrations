import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ImageUpload';
import { Copy, Send, ArrowLeft, ArrowRight, Check, BookOpen, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface QACheckpointPanelProps {
  showQACheckpoint: boolean;
  isBookCreated: boolean;
  createdBookId: string | null;
  currentQAPage: number;
  pageCount: number;
  displayImages: Record<number, string>;
  qaPageImages: Record<number, string>;
  getCurrentPagePrompt: (pageNum: number) => string | null;
  createBookMutation: any;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onImageUpload: (base64: string) => void;
  onRemoveImage: (pageNumber: number) => void;
  onCreateBook: () => void;
}

export function QACheckpointPanel({
  showQACheckpoint,
  isBookCreated,
  createdBookId,
  currentQAPage,
  pageCount,
  displayImages,
  qaPageImages,
  getCurrentPagePrompt,
  createBookMutation,
  onClose,
  onNavigate,
  onImageUpload,
  onRemoveImage,
  onCreateBook,
}: QACheckpointPanelProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Close Button */}
      <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="font-semibold text-sm">
              {currentQAPage === 0 ? 'Cover Page' : `Review Page ${currentQAPage}`}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {(() => {
                const prompt = getCurrentPagePrompt(currentQAPage);
                if (!prompt) return 'No title available';
                
                // Extract and clean the title
                const titleMatch = prompt.match(/^(.+?)(?:\n|$)/);
                let title = titleMatch ? titleMatch[1].trim() : prompt.substring(0, 100);
                
                // Remove markdown formatting (**), page/cover prefixes, and quotes
                title = title
                  .replace(/\*\*/g, '') // Remove **
                  .replace(/^(Page \d+:|Cover:)\s*/i, '') // Remove "Page X:" or "Cover:"
                  .replace(/^["']|["']$/g, '') // Remove surrounding quotes
                  .trim();
                
                return title || 'No title available';
              })()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => {
              const prompt = getCurrentPagePrompt(currentQAPage);
              if (prompt) {
                navigator.clipboard.writeText(prompt);
                toast.success(`Page ${currentQAPage} prompt copied!`, {
                  description: 'Paste in your AI tool'
                });
              }
            }}
            className="gap-1.5"
            aria-label="Copy image prompt"
          >
            <Copy className="h-4 w-4" />
            Copy Image Prompt
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close review panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Book Created Banner */}
        {isBookCreated && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium text-sm text-green-900 dark:text-green-100">
                    Book Created!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Images are from your book
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/books/${createdBookId}`)}
                className="w-full"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                View Book
              </Button>
            </div>
          </div>
        )}

        {/* Image Upload/Display Area */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Page Image</p>
          <div className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-primary/30 bg-muted/30">
            {displayImages[currentQAPage] ? (
              <div className="relative w-full h-full group">
                <img 
                  src={displayImages[currentQAPage]} 
                  alt={`Page ${currentQAPage} preview`}
                  className="w-full h-full object-contain"
                />
                {!isBookCreated && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onRemoveImage(currentQAPage)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                  >
                    Replace
                  </Button>
                )}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center gap-2 text-xs bg-green-600/90 text-white px-2 py-1 rounded">
                    <Check className="h-3 w-3" />
                    <span>{isBookCreated ? 'From book' : 'Uploaded'}</span>
                  </div>
                </div>
              </div>
            ) : isBookCreated ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No image generated yet</p>
                <p className="text-xs text-muted-foreground">
                  Click "View Book" to generate images for all pages
                </p>
              </div>
            ) : (
              <ImageUpload 
                onImageSelect={(file) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    onImageUpload(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
                disabled={createBookMutation.isPending}
                className="h-full"
              />
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
          💡 <strong>Tip:</strong> Copy prompt, generate in your AI tool, upload image, then navigate or create book.
        </div>
      </div>

      {/* Sticky Footer with Actions */}
      <div className="sticky bottom-0 bg-background border-t px-4 py-3 space-y-3 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {/* Navigation */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('prev')}
            disabled={currentQAPage === 0}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onClose}
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-1" />
            Adjust
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onNavigate('next')}
            disabled={currentQAPage === pageCount}
            className="flex-1"
          >
            {currentQAPage === pageCount ? 'Review' : `Page ${currentQAPage + 1}`}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Create Book Button - Always visible when book not created */}
        {!isBookCreated && (
          <div className="space-y-2">
            <Button
              onClick={onCreateBook}
              disabled={createBookMutation.isPending}
              className="w-full gap-2"
              size="sm"
            >
              <BookOpen className="h-4 w-4" />
              {Object.keys(qaPageImages).length > 0
                ? `Create Book (${Object.keys(qaPageImages).length} photo${Object.keys(qaPageImages).length > 1 ? 's' : ''})`
                : 'Create Book'
              }
            </Button>
            {Object.keys(qaPageImages).length === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Photos optional • Add now or generate later
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
