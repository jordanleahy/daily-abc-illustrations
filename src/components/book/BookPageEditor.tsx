import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, FileUp, FileX, BookOpen, X, ExternalLink } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { PublicationStatus } from '@/types/shared/status';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CopyImageButton } from '@/components/book/CopyImageButton';
import { useWordMetadata } from '@/hooks/useWordMetadata';
import { WordsCard } from '@/components/chat/WordsCard';
import { WordLearningControls } from '@/components/chat/WordLearningControls';
import { useBookPages } from '@/hooks/useBookPages';
import { useReadingPreferences } from '@/hooks/useReadingPreferences';
import { useAuthContext } from '@/contexts/AuthContext';
import { isContentPage } from '@/types/book';

interface BookPageEditorProps {
  // Page data
  currentPage: number;
  pageCount: number;
  displayImages: Record<number, string>;
  qaPageImages: Record<number, string>;
  qaPagePrompts: Record<number, string>;
  
  // Book info
  bookId: string | null;
  createdBookId: string | null;
  isBookCreated: boolean;
  bookStatus?: PublicationStatus;
  coverPageId?: string | null;
  thumbnailUrl?: string | null;
  
  // Callbacks
  onNavigate: (direction: 'prev' | 'next') => void;
  onImageUpload: (base64: string) => void;
  onRemoveImage: (pageNumber: number) => void;
  onCoverUpload?: (file: File) => void;
  onUpdatePageText?: (pageNumber: number, newText: string) => void;
  onToggleStatus?: () => void;
  onClose?: () => void;
  
  // Utility functions
  getCurrentPagePrompt: (pageNum: number) => string | null;
  
  // Text overlays
  pageTextOverlays?: Record<number, string>;
  
  // Optional: Control visibility of close button
  showCloseButton?: boolean;
}

export function BookPageEditor({
  currentPage,
  pageCount,
  displayImages,
  qaPageImages,
  qaPagePrompts,
  bookId,
  createdBookId,
  isBookCreated,
  bookStatus,
  coverPageId,
  thumbnailUrl,
  onNavigate,
  onImageUpload,
  onRemoveImage,
  onCoverUpload,
  onUpdatePageText,
  onToggleStatus,
  onClose,
  getCurrentPagePrompt,
  pageTextOverlays,
  showCloseButton = false
}: BookPageEditorProps) {
  const { toast } = useToast();
  const [copyConfirm, setCopyConfirm] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isCoverOpen, setIsCoverOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordStatuses, setWordStatuses] = useState<Record<number, 'difficult' | 'understood'>>({});
  
  const { user } = useAuthContext();
  const { preferences: readingPrefs } = useReadingPreferences();

  // Fetch book pages to determine page type
  const { pages: bookPages } = useBookPages(bookId);
  const currentPageData = bookPages?.[currentPage];
  const isCurrentPageContent = currentPageData && isContentPage(currentPageData);

  // Get text for current page
  const currentPageText = pageTextOverlays?.[currentPage] || 
    (currentPageData?.content as any)?.textOverlay || 
    '';

  // Word learning is feature-flagged and only for content pages with text
  const SHOW_WORDS_SECTION = false; // Feature flag
  const shouldShowWordLearning = SHOW_WORDS_SECTION && isCurrentPageContent && currentPageText;
  
  // Word metadata is managed by the page content
  const wordMetadata = shouldShowWordLearning 
    ? ((currentPageData?.content as any)?.words || [])
    : [];

  // Reset word learning state when page changes
  useEffect(() => {
    setCurrentWordIndex(0);
    setWordStatuses({});
  }, [currentPage]);

  // Reset edit state when page changes
  useEffect(() => {
    setIsEditingText(false);
    setEditedText(currentPageText);
  }, [currentPage, currentPageText]);

  const handleCopyPrompt = () => {
    const prompt = getCurrentPagePrompt(currentPage);
    if (!prompt) {
      toast({
        title: "No prompt available",
        description: "This page doesn't have a prompt yet",
        variant: "destructive"
      });
      return;
    }

    navigator.clipboard.writeText(prompt);
    setCopyConfirm(true);
    setTimeout(() => setCopyConfirm(false), 2000);
    
    toast({
      title: "Copied!",
      description: "Page prompt copied to clipboard"
    });
  };

  const handleImageUploadComplete = async (file: File) => {
    setIsUploadingImage(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await onImageUpload(base64);
        toast({
          title: "Image uploaded",
          description: "Page image has been updated successfully"
        });
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to read image file",
          variant: "destructive"
        });
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    onRemoveImage(currentPage);
    toast({
      title: "Image removed",
      description: "Page image has been removed"
    });
  };

  const handleSaveText = () => {
    if (onUpdatePageText && editedText !== currentPageText) {
      onUpdatePageText(currentPage, editedText);
      toast({
        title: "Text updated",
        description: "Page text has been saved"
      });
    }
    setIsEditingText(false);
  };

  const handleCancelEdit = () => {
    setEditedText(currentPageText);
    setIsEditingText(false);
  };

  const handleMarkWord = (status: 'difficult' | 'understood') => {
    setWordStatuses(prev => ({
      ...prev,
      [currentWordIndex]: status
    }));
    
    // Auto-advance to next word if not at the end
    if (wordMetadata && currentWordIndex < wordMetadata.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  };

  const handleNavigateWord = (direction: 'prev' | 'next') => {
    setCurrentWordIndex(prev => {
      if (direction === 'prev') {
        return Math.max(0, prev - 1);
      } else {
        return Math.min((wordMetadata?.length || 1) - 1, prev + 1);
      }
    });
  };

  const currentImage = displayImages[currentPage] || qaPageImages[currentPage];
  const pageTitle = currentPage === 0 ? 'Cover Page' : `Page ${currentPage}`;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">
          {pageTitle} {currentPage > 0 && `of ${pageCount}`}
        </h2>
        {showCloseButton && onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Page Image */}
        <Card className="p-4">
          {currentImage ? (
            <div className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={currentImage}
                  alt={pageTitle}
                  className="w-full h-full object-contain"
                />
                {/* Text overlay for content pages */}
                {shouldShowWordLearning && currentPageText && (
                  <div className="absolute inset-0 flex items-end justify-center p-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
                    <p className="text-white text-center text-lg font-semibold">
                      {currentPageText}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <CopyImageButton 
                  imageUrl={currentImage} 
                  bookName={pageTitle}
                />
                <ImageUpload
                  onImageSelect={handleImageUploadComplete}
                  disabled={isUploadingImage}
                />
                <Button
                  variant="destructive"
                  onClick={handleRemoveImage}
                  disabled={isUploadingImage}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No image yet</p>
              </div>
              <ImageUpload
                onImageSelect={handleImageUploadComplete}
                disabled={isUploadingImage}
              />
            </div>
          )}
        </Card>

        {/* Word Learning Section - Only for content pages with text */}
        {shouldShowWordLearning && wordMetadata.length > 0 && (
          <div className="space-y-4">
            <WordsCard
              words={wordMetadata}
              title="Words"
              isLoading={false}
              currentWordIndex={currentWordIndex}
              wordStatuses={wordStatuses}
            />
            
            <WordLearningControls
              onMarkDifficult={() => handleMarkWord('difficult')}
              onMarkUnderstood={() => handleMarkWord('understood')}
              onNavigateWord={handleNavigateWord}
              currentWordIndex={currentWordIndex}
              totalWords={wordMetadata.length}
            />
          </div>
        )}

        {/* Page Prompt */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Page Prompt</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPrompt}
              >
                {copyConfirm ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg max-h-40 overflow-y-auto">
              {getCurrentPagePrompt(currentPage) || 'No prompt available'}
            </div>
          </div>
        </Card>

        {/* Optional Book Thumbnail Upload - Only for cover page */}
        {currentPage === 0 && onCoverUpload && (
          <Collapsible open={isCoverOpen} onOpenChange={setIsCoverOpen}>
            <Card className="p-4">
              <CollapsibleTrigger className="w-full flex items-center justify-between">
                <h3 className="text-sm font-medium">Book Thumbnail (Optional)</h3>
                <ChevronRight className={`h-4 w-4 transition-transform ${isCoverOpen ? 'rotate-90' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                {thumbnailUrl ? (
                  <div className="space-y-2">
                    <img
                      src={thumbnailUrl}
                      alt="Book thumbnail"
                      className="w-full h-auto rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Handle thumbnail removal if needed
                        toast({
                          title: "Feature coming soon",
                          description: "Thumbnail removal will be available soon"
                        });
                      }}
                    >
                      Remove Thumbnail
                    </Button>
                  </div>
                ) : (
                  <ImageUpload
                    onImageSelect={(file) => {
                      if (onCoverUpload) {
                        onCoverUpload(file);
                      }
                    }}
                  />
                )}
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t p-4 space-y-3">
        {/* Navigation */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onNavigate('prev')}
            disabled={currentPage === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate('next')}
            disabled={currentPage >= pageCount}
            className="flex-1"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Book Actions */}
        {isBookCreated && (
          <div className="flex gap-2">
            {/* Publish/Unpublish toggle */}
            <Button
              variant={bookStatus === PublicationStatus.DRAFT ? "default" : "destructive"}
              onClick={onToggleStatus}
              className="flex-1"
            >
              {bookStatus === PublicationStatus.DRAFT ? (
                <>
                  <FileUp className="h-4 w-4 mr-2" />
                  Publish
                </>
              ) : (
                <>
                  <FileX className="h-4 w-4 mr-2" />
                  Unpublish
                </>
              )}
            </Button>
            
            {/* Read button - Show when book is published */}
            {bookStatus !== PublicationStatus.DRAFT && bookId && (
              <Button
                variant="default"
                onClick={() => window.location.href = `/books/${bookId}/read`}
                disabled={!bookId}
                className="flex-1"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Read
              </Button>
            )}
          </div>
        )}

        {/* Image Generator Link */}
        {createdBookId && (
          <Button
            variant="outline"
            onClick={() => {
              const url = `https://www.imagegenerator.com/editor?bookId=${createdBookId}&page=${currentPage}`;
              window.open(url, '_blank');
            }}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Image Generator
          </Button>
        )}
      </div>
    </div>
  );
}
