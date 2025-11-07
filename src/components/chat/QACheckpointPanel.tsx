import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ImageUpload';
import { Shimmer } from '@/components/ui/shimmer';
import { Copy, Send, ArrowLeft, ArrowRight, Check, BookOpen, X, ExternalLink, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { TextOverlay } from '@/components/ui/text-overlay';
import { InlineEditInput } from '@/components/ui/inline-edit-input';

interface QACheckpointPanelProps {
  showQACheckpoint: boolean;
  isBookCreated: boolean;
  createdBookId: string | null;
  currentQAPage: number;
  pageCount: number;
  displayImages: Record<number, string>;
  qaPageImages: Record<number, string>;
  qaPagePrompts: Record<number, string>;
  getCurrentPagePrompt: (pageNum: number) => string | null;
  createBookMutation: any;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onImageUpload: (base64: string) => void;
  onRemoveImage: (pageNumber: number) => void;
  onCreateBook: () => void;
  coverPageId?: string | null;
  bookId?: string | null;
  onCoverUpload?: (file: File) => void;
  pageTextOverlays?: Record<number, string>;
  onUpdatePageText?: (pageNumber: number, newText: string) => void;
  onPublish?: () => void;
}

export function QACheckpointPanel({
  showQACheckpoint,
  isBookCreated,
  createdBookId,
  currentQAPage,
  pageCount,
  displayImages,
  qaPageImages,
  qaPagePrompts,
  getCurrentPagePrompt,
  createBookMutation,
  onClose,
  onNavigate,
  onImageUpload,
  onRemoveImage,
  onCreateBook,
  coverPageId,
  bookId,
  onCoverUpload,
  pageTextOverlays = {},
  onUpdatePageText,
  onPublish,
}: QACheckpointPanelProps) {
  const navigate = useNavigate();
  const [hasClickedCopy, setHasClickedCopy] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);

  const currentCoverPrompt = qaPagePrompts[0] || null;
  
  // Check if all pages have images uploaded
  const allImagesUploaded = useMemo(() => {
    if (!isBookCreated) return false;
    
    // Check pages 1 through pageCount
    for (let i = 1; i <= pageCount; i++) {
      if (!displayImages[i]) {
        return false;
      }
    }
    return true;
  }, [isBookCreated, pageCount, displayImages]);
  
  // Get current page text from database or extract from prompt
  const currentPageText = pageTextOverlays[currentQAPage] || (() => {
    const prompt = getCurrentPagePrompt(currentQAPage);
    if (!prompt) return '';
    
    // Extract title from prompt
    const titleMatch = prompt.match(/^(.+?)(?:\n|$)/);
    let title = titleMatch ? titleMatch[1].trim() : '';
    
    // Clean the title
    title = title
      .replace(/\*\*/g, '')
      .replace(/^(Page \d+:|Cover:)\s*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();
    
    return title;
  })();

  // Reset states when page changes
  useEffect(() => {
    setHasClickedCopy(false);
    setShowConfirmation(false);
    setIsEditingText(false);
  }, [currentQAPage]);

  // Handle copy with confirmation and delayed transition
  const handleCopyPrompt = () => {
    const prompt = getCurrentPagePrompt(currentQAPage);
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setShowConfirmation(true);
      toast.success('Prompt copied to clipboard!', {
        description: 'Creating your book...',
        duration: 3000
      });

      // Create book immediately if not already created
      if (!isBookCreated && !createBookMutation.isPending) {
        onCreateBook();
      }

      // Transition to upload after 5 seconds
      setTimeout(() => {
        setShowConfirmation(false);
        setHasClickedCopy(true);
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col max-h-[90vh] md:h-full bg-background pt-[env(safe-area-inset-top,1rem)] md:pt-0">
      {/* Header with Close Button */}
      <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="font-semibold text-sm">
              {currentQAPage === 1 
                ? 'Page 1: Cover' 
                : currentQAPage === 2
                ? 'Page 2: Focus'
                : `Page ${currentQAPage}`
              }
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
                
                {/* Text Overlay with Editing */}
                {currentPageText && (
                  <>
                    {isEditingText && onUpdatePageText ? (
                      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm px-4 py-3">
                        <InlineEditInput
                          value={currentPageText}
                          onSave={(newText) => {
                            onUpdatePageText(currentQAPage, newText);
                            setIsEditingText(false);
                            toast.success('Text updated!');
                          }}
                          className="text-white text-center font-semibold text-lg bg-transparent border-white/30"
                          isEditing={true}
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => setIsEditingText(true)}
                        className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm px-4 py-3 cursor-pointer hover:bg-black/70 transition-colors group"
                        title="Click to edit text"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-white text-center font-semibold text-lg leading-tight line-clamp-2">
                            {currentPageText}
                          </p>
                          <Pencil className="h-4 w-4 text-white/60 group-hover:text-white/90 transition-colors flex-shrink-0" />
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRemoveImage(currentQAPage)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                >
                  Replace
                </Button>
              </div>
            ) : showConfirmation ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-base font-semibold mb-2">Prompt Copied!</p>
                <p className="text-xs text-muted-foreground">
                  Upload area loading...
                </p>
              </div>
            ) : !hasClickedCopy ? (
              <button
                onClick={handleCopyPrompt}
                className="w-full h-full flex flex-col items-center justify-center p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Copy className="h-8 w-8 text-primary" />
                </div>
                <p className="text-base font-semibold mb-2">Copy Image Prompt</p>
                <p className="text-xs text-muted-foreground">
                  Click to copy prompt for AI Studio
                </p>
              </button>
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

        {/* Cover Image Prompt - Show on page 1 (Cover Page) */}
        {currentQAPage === 1 && currentCoverPrompt && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Cover Image Prompt</p>
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
              <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                {currentCoverPrompt}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(currentCoverPrompt);
                  toast.success('Cover prompt copied!', {
                    description: 'Creating your book...',
                    duration: 3000
                  });
                  
                  // Create book immediately if not already created
                  if (!isBookCreated && !createBookMutation.isPending) {
                    onCreateBook();
                  }
                }}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy Cover Prompt
              </Button>
            </div>
          </div>
        )}

        {/* Copy Prompt Button - Show when upload area is visible */}
        {hasClickedCopy && !displayImages[currentQAPage] && (
          <Button
            variant="secondary"
            size="lg"
            onClick={handleCopyPrompt}
            className="w-full"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Image Prompt Again
          </Button>
        )}
      </div>

      {/* Sticky Footer with Actions */}
      <div className="sticky bottom-0 bg-background border-t px-4 py-3 space-y-3 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {/* Cover Image Upload - Show when book is created */}
        {isBookCreated && onCoverUpload && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Cover Image (Optional)</p>
            <div className="aspect-video rounded-lg overflow-hidden border-2 border-dashed border-primary/30 bg-muted/30">
              {displayImages[0] ? (
                <div className="relative w-full h-full group">
                  <img 
                    src={displayImages[0]} 
                    alt="Book cover preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onRemoveImage(0)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                  >
                    Replace
                  </Button>
                </div>
              ) : (
                <ImageUpload 
                  onImageSelect={(file) => {
                    onCoverUpload(file);
                  }}
                  disabled={createBookMutation.isPending}
                  className="h-full"
                />
              )}
            </div>
          </div>
        )}
        
        {/* Publish Button - Show when all images are uploaded */}
        {allImagesUploaded && onPublish && (
          <Button
            variant="default"
            size="lg"
            onClick={onPublish}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Send className="h-4 w-4 mr-2" />
            Publish Book to Daily Content
          </Button>
        )}
        
        {/* Navigation */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('prev')}
            disabled={currentQAPage === 1}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => window.open('https://aistudio.google.com/prompts/new_chat', '_blank')}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Image Generator
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onNavigate('next')}
            disabled={currentQAPage === pageCount}
            className="flex-1"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

      </div>
    </div>
  );
}
