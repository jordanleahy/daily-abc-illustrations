import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ImageUpload';
import { Shimmer } from '@/components/ui/shimmer';
import { Copy, Send, ArrowLeft, ArrowRight, Check, BookOpen, X, ExternalLink, Pencil, FileUp, FileX, ChevronDown, Type } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import { TextOverlay } from '@/components/ui/text-overlay';
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { PublicationStatus } from '@/types/shared/status';
import { WordsCard } from './WordsCard';
import { WordLearningControls } from './WordLearningControls';
import { useWordMetadata } from '@/hooks/useWordMetadata';
import { useBookPages } from '@/hooks/useBookPages';
import { useReadingPreferences } from '@/hooks/useReadingPreferences';
import { BookImage } from '@/components/ui/book-image';
import { useAuthContext } from '@/contexts/AuthContext';
import { isContentPage } from '@/types/book';

// Lazy load ImageTextOverlayEditor (same pattern as PageCard)
const ImageTextOverlayEditor = lazy(() =>
  import('@/components/page-prompts/ImageTextOverlayEditor').then((module) => ({
    default: module.ImageTextOverlayEditor,
  }))
);

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
  thumbnailUrl?: string | null;
  pageTextOverlays?: Record<number, string>;
  onUpdatePageText?: (pageNumber: number, newText: string) => void;
  onToggleStatus?: () => void;
  bookStatus?: PublicationStatus;
}

// Feature flag to show/hide the Words learning section
const SHOW_WORDS_SECTION = false;

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
  thumbnailUrl,
  pageTextOverlays = {},
  onUpdatePageText,
  onToggleStatus,
  bookStatus = PublicationStatus.DRAFT,
}: QACheckpointPanelProps) {
  const navigate = useNavigate();
  const [hasClickedCopy, setHasClickedCopy] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [copiedPages, setCopiedPages] = useState<Set<number>>(new Set());
  const [isThumbnailOpen, setIsThumbnailOpen] = useState(false);
  const [showTextOverlayEditor, setShowTextOverlayEditor] = useState(false);
  const { generateMetadata, isGenerating } = useWordMetadata();
  const { isOverlayHidden, toggleOverlay, isToggling, isLoading: isPreferencesLoading } = useReadingPreferences();
  const { user } = useAuthContext();
  
  // Fetch pages data
  const { pages } = useBookPages(bookId || undefined);
  
  // Get current page ID for overlay toggle
  const currentPageId = useMemo(() => {
    return pages?.find(p => p.page_number === currentQAPage)?.id;
  }, [pages, currentQAPage]);
  
  // Determine current page and whether it should have text overlay
  const currentPage = useMemo(() => {
    return pages?.find(p => p.page_number === currentQAPage);
  }, [pages, currentQAPage]);

  const shouldShowTextOverlay = useMemo(() => {
    // Only show text overlay editor for content pages (page 3+)
    // Never show for cover (page 1) or educational (page 2)
    return currentPage ? isContentPage(currentPage) : false;
  }, [currentPage]);
  
  // Word Learning Helper state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordStatuses, setWordStatuses] = useState<Record<number, 'difficult' | 'understood'>>({});

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

  // Get current page words metadata
  const currentPageWords = useMemo(() => {
    const currentPage = pages?.find(p => p.page_number === currentQAPage);
    return currentPage?.content?.words;
  }, [pages, currentQAPage]);

  // Auto-generate word metadata if page has text but no words
  useEffect(() => {
    const currentPage = pages?.find(p => p.page_number === currentQAPage);
    if (currentPage && currentPageText && !currentPageWords && bookId) {
      // Silently generate word metadata in the background
      generateMetadata({
        pageId: currentPage.id,
        bookId,
        title: currentPageText,
        currentContent: currentPage.content
      }).catch(error => {
        console.error('Failed to auto-generate word metadata:', error);
      });
    }
  }, [currentQAPage, currentPageText, currentPageWords, pages, bookId, generateMetadata]);

  // Reset states when page changes (not when copiedPages changes on same page)
  useEffect(() => {
    setShowConfirmation(false);
    setIsEditingText(false);
    // Check if this page has been copied before
    setHasClickedCopy(copiedPages.has(currentQAPage));
    
    // Reset word learning state
    setCurrentWordIndex(0);
    setWordStatuses({});
  }, [currentQAPage]); // Removed copiedPages to prevent immediate trigger
  
  // Hide confirmation immediately when image is pasted/uploaded
  useEffect(() => {
    if (displayImages[currentQAPage]) {
      setShowConfirmation(false);
    }
  }, [displayImages, currentQAPage]);
  
  // Word Learning Helper handlers
  const handleNavigateWord = (direction: 'prev' | 'next') => {
    setCurrentWordIndex(prev => {
      if (direction === 'prev') {
        return Math.max(0, prev - 1);
      } else {
        return Math.min((currentPageWords?.length || 0) - 1, prev + 1);
      }
    });
  };
  
  const handleMarkDifficult = () => {
    setWordStatuses(prev => ({ ...prev, [currentWordIndex]: 'difficult' }));
    // Move to next word if not last
    if (currentWordIndex < (currentPageWords?.length || 0) - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  };
  
  const handleMarkUnderstood = () => {
    setWordStatuses(prev => ({ ...prev, [currentWordIndex]: 'understood' }));
    // Move to next word if not last
    if (currentWordIndex < (currentPageWords?.length || 0) - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  };

  // Helper function to render text with current word always enlarged
  const renderTextWithEnlargedWord = (
    fullText: string, 
    currentWord: string | undefined
  ) => {
    // If no current word, return full text normally
    if (!currentWord) {
      return <span className="text-lg font-semibold">{fullText}</span>;
    }

    // Find the current word in the text (case-insensitive)
    const lowerText = fullText.toLowerCase();
    const lowerWord = currentWord.toLowerCase();
    const wordIndex = lowerText.indexOf(lowerWord);

    // If word not found, return full text normally
    if (wordIndex === -1) {
      return <span className="text-lg font-semibold">{fullText}</span>;
    }

    // Split text into: before word, the word, after word
    const before = fullText.slice(0, wordIndex);
    const word = fullText.slice(wordIndex, wordIndex + currentWord.length);
    const after = fullText.slice(wordIndex + currentWord.length);

    return (
      <>
        <span className="text-lg font-semibold">{before}</span>
        <span 
          className="text-lg font-semibold text-white inline-block px-2 py-1 rounded bg-yellow-500/60"
          style={{ 
            transform: 'scale(2)',
            transformOrigin: 'center center',
            display: 'inline-block',
            margin: '0 1rem',
            fontWeight: '800',
            transition: 'all 0.6s ease-in-out'
          }}
        >
          {word}
        </span>
        <span className="text-lg font-semibold">{after}</span>
      </>
    );
  };

  // Handle copy with confirmation and delayed transition
  const handleCopyPrompt = async () => {
    const prompt = getCurrentPagePrompt(currentQAPage);
    if (prompt) {
      try {
        await copyToClipboard(prompt);
        setShowConfirmation(true);
      
        // Mark this page as copied
        setCopiedPages(prev => new Set(prev).add(currentQAPage));

        // Create book immediately if not already created
        if (!isBookCreated && !createBookMutation.isPending) {
          onCreateBook();
        }

        // Transition to upload after 5 seconds
        setTimeout(() => {
          setShowConfirmation(false);
          setHasClickedCopy(true);
        }, 5000);
      } catch (error) {
        console.error('Failed to copy prompt:', error);
      }
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
                : (() => {
                    const currentPage = pages?.find(p => p.page_number === currentQAPage);
                    if (currentPage?.content) {
                      const textOverlay = (currentPage.content as any)?.textOverlay;
                      return textOverlay?.text || `Page ${currentQAPage}`;
                    }
                    return `Page ${currentQAPage}`;
                  })()
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
                <BookImage
                  src={displayImages[currentQAPage]} 
                  alt={`Page ${currentQAPage} preview`}
                  className="w-full h-full object-contain"
                  priority={true}
                  enableMobileSave={true}
                />
                
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onRemoveImage(currentQAPage)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                >
                  Replace
                </Button>
                
                {/* Text Overlay Editor button - only for content pages */}
                {shouldShowTextOverlay && displayImages[currentQAPage] && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTextOverlayEditor(true)}
                    className="absolute top-2 right-20 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                    title="Edit text overlay"
                  >
                    <Type className="w-3 h-3 mr-1" />
                    Text
                  </Button>
                )}
                
                {/* Show/Hide Overlay buttons - only for content pages */}
                {shouldShowTextOverlay && currentPageId && isOverlayHidden(currentPageId) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (!isToggling) {
                        toggleOverlay(currentPageId);
                        toast.success('Text overlay shown');
                      }
                    }}
                    disabled={isToggling}
                    className="absolute top-11 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                  >
                    Show Overlay
                  </Button>
                )}
                
                {/* Hide Overlay button when overlay is shown - only for content pages */}
                {shouldShowTextOverlay && currentPageId && !isOverlayHidden(currentPageId) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (!isToggling) {
                        toggleOverlay(currentPageId);
                        toast.success('Text overlay hidden');
                      }
                    }}
                    disabled={isToggling}
                    className="absolute top-11 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                  >
                    Hide Overlay
                  </Button>
                )}
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
                  // Store scroll position before processing
                  const scrollX = window.scrollX || window.pageXOffset;
                  const scrollY = window.scrollY || window.pageYOffset;
                  
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    onImageUpload(reader.result as string);
                    
                    // Restore scroll position after upload
                    requestAnimationFrame(() => {
                      window.scrollTo(scrollX, scrollY);
                    });
                  };
                  reader.readAsDataURL(file);
                }}
                disabled={createBookMutation.isPending}
                className="h-full"
              />
            )}
          </div>
        </div>

        {/* Words Analysis Card */}
        {SHOW_WORDS_SECTION && currentPageWords && currentPageWords.length > 0 && (
          <>
            <WordsCard 
              words={currentPageWords}
              title={currentPageText}
              isLoading={isGenerating}
              currentWordIndex={currentWordIndex}
              wordStatuses={wordStatuses}
            />
            
            {/* Word Learning Controls */}
            <WordLearningControls
              onMarkDifficult={handleMarkDifficult}
              onMarkUnderstood={handleMarkUnderstood}
              onNavigateWord={handleNavigateWord}
              currentWordIndex={currentWordIndex}
              totalWords={currentPageWords.length}
            />
          </>
        )}

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
                onClick={async () => {
                  try {
                    await copyToClipboard(currentCoverPrompt);
                    toast.success('Cover prompt copied!', {
                      description: 'Creating your book...',
                      duration: 3000
                    });
                    
                    // Create book immediately if not already created
                    if (!isBookCreated && !createBookMutation.isPending) {
                      onCreateBook();
                    }
                  } catch (error) {
                    toast.error('Failed to copy prompt');
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
        {/* Thumbnail Image Upload - Show only when all page images are uploaded */}
        {allImagesUploaded && onCoverUpload && (
          <Collapsible open={isThumbnailOpen} onOpenChange={setIsThumbnailOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full flex items-center justify-between p-2 h-auto hover:bg-muted/50"
              >
                <p className="text-xs font-medium text-muted-foreground">Book Thumbnail (Optional)</p>
                <ChevronDown 
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isThumbnailOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <div className="h-48 rounded-lg overflow-hidden border-2 border-dashed border-primary/30 bg-muted/30">
                {thumbnailUrl ? (
                  <div className="relative w-full h-full group">
                    <BookImage 
                      src={thumbnailUrl} 
                      alt="Book thumbnail preview"
                      className="w-full h-full object-cover rounded-lg"
                      priority={false}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // Trigger file picker to replace
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/png,image/jpeg,image/jpg,image/webp';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) onCoverUpload(file);
                        };
                        input.click();
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                    >
                      Replace
                    </Button>
                  </div>
                ) : (
                  <ImageUpload 
                    onImageSelect={(file) => {
                      // Store scroll position before processing
                      const scrollX = window.scrollX || window.pageXOffset;
                      const scrollY = window.scrollY || window.pageYOffset;
                      
                      onCoverUpload(file);
                      
                      // Restore scroll position after upload
                      requestAnimationFrame(() => {
                        window.scrollTo(scrollX, scrollY);
                      });
                    }}
                    disabled={createBookMutation.isPending}
                    className="h-full"
                    requireSquare={false}
                  />
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Publish/Unpublish Toggle - Show when all images are uploaded */}
        {allImagesUploaded && onToggleStatus && (
          <div className={bookStatus === PublicationStatus.DRAFT ? "" : "flex gap-2"}>
            <Button
              variant={bookStatus === PublicationStatus.DRAFT ? 'default' : 'outline'}
              size="lg"
              onClick={onToggleStatus}
              className={bookStatus === PublicationStatus.DRAFT 
                ? "w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                : "flex-1"
              }
            >
              {bookStatus === PublicationStatus.DRAFT ? (
                <>
                  <FileUp className="h-4 w-4 mr-2" />
                  Publish Book
                </>
              ) : (
                <>
                  <FileX className="h-4 w-4 mr-2" />
                  Unpublish Book
                </>
              )}
            </Button>
            
            {/* Read Book button - Show when book is published */}
            {bookStatus !== PublicationStatus.DRAFT && bookId && (
              <Button
                variant="default"
                size="lg"
                onClick={() => navigate(`/books/${bookId}/read`)}
                className="flex-1"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Read Book
              </Button>
            )}
          </div>
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

      {/* Text Overlay Editor - Same component as desktop */}
      {user && currentPage && shouldShowTextOverlay && displayImages[currentQAPage] && showTextOverlayEditor && (
        <Suspense fallback={null}>
          <ImageTextOverlayEditor
            open={showTextOverlayEditor}
            onOpenChange={setShowTextOverlayEditor}
            imageUrl={displayImages[currentQAPage]}
            defaultText={currentPageText}
            onTextChange={(newText) => {
              if (onUpdatePageText) {
                onUpdatePageText(currentQAPage, newText);
              }
            }}
            mode="page"
            pageId={currentPage.id}
            bookId={bookId || ''}
            userId={user.id}
          />
        </Suspense>
      )}
    </div>
  );
}
