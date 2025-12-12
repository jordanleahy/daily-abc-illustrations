import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ImageUpload';
import { Shimmer } from '@/components/ui/shimmer';
import { Copy, Send, ArrowLeft, ArrowRight, Check, BookOpen, X, ExternalLink, Pencil, FileUp, FileX, ChevronDown, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { compositeTextOnImage } from '@/utils/imageTextCompositor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';
import { TextOverlay } from '@/components/ui/text-overlay';
import { copyToClipboard, copyImageToClipboard } from '@/utils/clipboardHelpers';
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


interface BookEditorPanelProps {
  showEditor: boolean;
  isBookCreated: boolean;
  createdBookId: string | null;
  currentPageNumber: number;
  pageCount: number;
  displayImages: Record<number, string>;
  displayColoringImages?: Record<number, string>;
  displayTextImages?: Record<number, string>;
  editorPageImages: Record<number, string>;
  editorPagePrompts: Record<number, string>;
  getCurrentPagePrompt: (pageNum: number) => string | null;
  getCurrentPageTitle?: (pageNum: number) => string | null;
  createBookMutation: any;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onImageUpload: (base64: string, imageMode: 'color' | 'bw' | 'text') => void;
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
  bookTitle?: string;
  bookDescription?: string;
  characterTheme?: string;
}

// Feature flag to show/hide the Words learning section
const SHOW_WORDS_SECTION = false;

export function BookEditorPanel({
  showEditor,
  isBookCreated,
  createdBookId,
  currentPageNumber,
  pageCount,
  displayImages,
  displayColoringImages = {},
  displayTextImages = {},
  editorPageImages,
  editorPagePrompts,
  getCurrentPagePrompt,
  getCurrentPageTitle,
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
  bookTitle,
  bookDescription,
  characterTheme,
}: BookEditorPanelProps) {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [copiedPages, setCopiedPages] = useState<Set<number>>(new Set());
  const [isThumbnailOpen, setIsThumbnailOpen] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isEditingOverlayText, setIsEditingOverlayText] = useState(false);
  const [hasRunQaAgent, setHasRunQaAgent] = useState(false);
  const [imageMode, setImageMode] = useState<'color' | 'bw' | 'text'>('color');
  const [isGeneratingTextImage, setIsGeneratingTextImage] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const { toast } = useToast();
  
  // Check if user has seen the onboarding (one-time only)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return localStorage.getItem('qa-panel-onboarding-seen') === 'true';
  });
  
  // Derive hasClickedCopy from whether prompt exists for current page OR page was copied
  const hasClickedCopy = !!editorPagePrompts[currentPageNumber] || copiedPages.has(currentPageNumber);
  
  // Handle close with context-aware navigation
  const handleClose = () => {
    const cameFromMyBooks = window.history.state?.usr?.from === 'my-books';
    
    if (cameFromMyBooks) {
      navigate('/books', { replace: true });
    } else {
      onClose();
    }
  };
  
  const { generateMetadata, isGenerating } = useWordMetadata();
  const { isOverlayHidden, toggleOverlay, isToggling, isLoading: isPreferencesLoading } = useReadingPreferences();
  const { user } = useAuthContext();
  
  // Fetch pages data
  const { pages } = useBookPages(bookId || undefined);
  
  // Helper function to get image for current page based on image mode
  const currentPageImage = useMemo(() => {
    if (imageMode === 'text') {
      // Text mode - show text image
      return displayTextImages[currentPageNumber] || null;
    }
    if (imageMode === 'bw') {
      // B&W mode - show coloring image
      return displayColoringImages[currentPageNumber] || null;
    }
    // Color mode - For page 1 (cover), use the passed thumbnailUrl from parent
    if (currentPageNumber === 1) {
      return thumbnailUrl || displayImages[1] || null;
    }
    // For all other pages, use the displayImages map by page_number
    const image = displayImages[currentPageNumber];
    return image !== undefined ? image : null;
  }, [currentPageNumber, thumbnailUrl, displayImages, displayColoringImages, displayTextImages, imageMode]);

  // Check if each image type exists for current page
  const hasColorImage = useMemo(() => {
    if (currentPageNumber === 1) {
      return !!(thumbnailUrl || displayImages[1]);
    }
    return !!displayImages[currentPageNumber];
  }, [currentPageNumber, thumbnailUrl, displayImages]);

  const hasBwImage = useMemo(() => {
    return !!displayColoringImages[currentPageNumber];
  }, [currentPageNumber, displayColoringImages]);

  const hasTextImage = useMemo(() => {
    return !!displayTextImages[currentPageNumber];
  }, [currentPageNumber, displayTextImages]);
  
  // Handle saving overlay text
  const handleSaveOverlayText = async (newText: string) => {
    if (onUpdatePageText) {
      onUpdatePageText(currentPageNumber, newText);
    }
    setIsEditingOverlayText(false);
  };

  // Handle generating text image from color image
  const handleGenerateTextImage = async () => {
    // Get the color image URL
    const colorImageUrl = currentPageNumber === 1 
      ? (thumbnailUrl || displayImages[1]) 
      : displayImages[currentPageNumber];
    
    if (!colorImageUrl) {
      toast({ title: "No color image", description: "Upload a color image first", variant: "destructive" });
      return;
    }

    // Get the page title/text
    const pageText = pageTextOverlays[currentPageNumber] || getCurrentPageTitle?.(currentPageNumber) || '';
    if (!pageText) {
      toast({ title: "No text available", description: "This page has no text overlay", variant: "destructive" });
      return;
    }

    setIsGeneratingTextImage(true);
    try {
      // Fetch the image and convert to data URL
      const response = await fetch(colorImageUrl);
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Composite text onto image
      const result = await compositeTextOnImage(dataUrl, pageText);
      
      // Upload the composited image
      onImageUpload(result.dataUrl, 'text');
    } catch (error) {
      console.error('Error generating text image:', error);
      toast({ title: "Generation failed", description: "Could not create text image", variant: "destructive" });
    } finally {
      setIsGeneratingTextImage(false);
    }
  };
  
  // Get current page ID for overlay toggle
  const currentPageId = useMemo(() => {
    return pages?.find(p => p.page_number === currentPageNumber)?.id;
  }, [pages, currentPageNumber]);
  
  // Determine current page and whether it should have text overlay
  const currentPage = useMemo(() => {
    return pages?.find(p => p.page_number === currentPageNumber);
  }, [pages, currentPageNumber]);

  const shouldShowTextOverlay = useMemo(() => {
    // Only show text overlay editor for content pages (page 3+)
    // Never show for cover (page 1) or educational (page 2)
    return currentPage ? isContentPage(currentPage) : false;
  }, [currentPage]);
  
  // Word Learning Helper state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordStatuses, setWordStatuses] = useState<Record<number, 'difficult' | 'understood'>>({});

  // Generate thumbnail using AI
  const handleGenerateThumbnail = async () => {
    if (!bookTitle) {
      toast({
        title: "Missing title",
        description: "Book title is required to generate a thumbnail",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingThumbnail(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: {
          bookTitle,
          bookDescription,
          characterTheme,
        },
      });

      if (error) throw error;
      
      if (data?.imageUrl) {
        // Convert base64 to File and call onCoverUpload
        const response = await fetch(data.imageUrl);
        const blob = await response.blob();
        // Use png type since the AI generates PNG images
        const file = new File([blob], `generated-thumbnail-${Date.now()}.png`, { type: blob.type || 'image/png' });
        
        console.log('[Generate Thumbnail] Created file:', file.name, file.size, file.type);
        
        if (onCoverUpload) {
          await onCoverUpload(file);
          toast({
            title: "Thumbnail generated",
            description: "AI-generated thumbnail has been applied",
          });
        } else {
          console.error('[Generate Thumbnail] onCoverUpload not provided');
          toast({
            title: "Cannot apply thumbnail",
            description: "Missing upload handler - please try from the book editor",
            variant: "destructive",
          });
        }
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate thumbnail",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  
  // Check if all pages have images uploaded
  const allImagesUploaded = useMemo(() => {
    if (!isBookCreated) return false;
    
    // Check cover page using thumbnailUrl or displayImages[1]
    const hasCoverImage = !!(thumbnailUrl || displayImages[1]);
    if (!hasCoverImage) return false;
    
    // Check other pages (2 through pageCount)
    for (let i = 2; i <= pageCount; i++) {
      if (!displayImages[i]) {
        return false;
      }
    }
    return true;
  }, [isBookCreated, pageCount, displayImages, thumbnailUrl]);
  
  // Get current page text from page.title or extract from prompt
  const currentPageText = currentPage?.title || pageTextOverlays[currentPageNumber] || (() => {
    const prompt = getCurrentPagePrompt(currentPageNumber);
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
    return currentPage?.content?.words;
  }, [pages, currentPageNumber]);

  // Auto-generate word metadata if page has text but no words
  useEffect(() => {
    const currentPage = pages?.find(p => p.page_number === currentPageNumber);
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
  }, [currentPageNumber, currentPageText, currentPageWords, pages, bookId, generateMetadata]);

  // Reset states when page changes (not when copiedPages changes on same page)
  useEffect(() => {
    setShowConfirmation(false);
    setIsEditingText(false);
    
    // Reset word learning state
    setCurrentWordIndex(0);
    setWordStatuses({});
  }, [currentPageNumber]); // Removed copiedPages to prevent immediate trigger
  
  // Hide confirmation immediately when image is pasted/uploaded
  useEffect(() => {
    if (currentPageImage) {
      setShowConfirmation(false);
    }
  }, [currentPageImage]);
  
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

  // Helper function to extract only the image prompt content, removing instructional sections
  const stripTitleFromPrompt = (prompt: string): string => {
    // First, try to extract content after "**Image Prompt:**" marker
    const imagePromptMatch = prompt.match(/\*\*Image Prompt:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/i);
    if (imagePromptMatch && imagePromptMatch[1].trim()) {
      return imagePromptMatch[1].trim();
    }
    
    // Fallback: Remove all instructional sections if no explicit Image Prompt marker
    return prompt
      // Remove JSON metadata prefix: [pageType: "cover", pageNumber: 0]
      .replace(/^\[pageType:\s*"[^"]*",\s*pageNumber:\s*\d+\]\s*/gi, '')
      // Remove pagetype metadata at the beginning
      .replace(/^pagetype:\s*"[^"]*"\s*/gi, '')
      // Remove title headers: **Page N: Title**, **Cover: Title**, etc.
      .replace(/^\*\*(?:Page\s+\d+|Cover|Educational Focus):[^\n*]*\*\*\s*/gi, '')
      // Remove character section: **Paw Patrol Character(s):** ...
      .replace(/\*\*(?:Paw Patrol |Disney |Frozen |Peppa Pig |Bluey |Cocomelon |Moana |Mickey Mouse |Mario |Sesame Street |)Character\(?s?\)?:\*\*[^\n]*\n?/gi, '')
      // Remove educational content section
      .replace(/\*\*Educational Content:\*\*[\s\S]*?(?=\n\*\*|$)/gi, '')
      // Remove activity section  
      .replace(/\*\*Activity:\*\*[\s\S]*?(?=\n\*\*|$)/gi, '')
      // Remove "Image Prompt:" label if present but keep the content
      .replace(/\*\*Image Prompt:\*\*\s*/gi, '')
      // Remove DISPLAY TITLE instructions and everything after
      .replace(/\n*DISPLAY TITLE:[\s\S]*$/gi, '')
      // Clean up bullet points and extra whitespace
      .replace(/^\s*\*\s+/gm, '')
      .trim();
  };

  // Handle copy with confirmation and delayed transition
  const handleCopyPrompt = async () => {
    // Mark onboarding as seen when copying from the onboarding overlay
    if (!hasSeenOnboarding) {
      localStorage.setItem('qa-panel-onboarding-seen', 'true');
      setHasSeenOnboarding(true);
    }
    
    const prompt = getCurrentPagePrompt(currentPageNumber);
    
    // Add user feedback when no prompt is found
    if (!prompt) {
      console.error(`[Copy Prompt] No prompt available for page ${currentPageNumber}`);
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "No prompt available",
        description: `The image prompt for page ${currentPageNumber} hasn't been generated yet. Please wait for the AI to finish creating the outline.`,
        variant: "destructive"
      });
      return;
    }
    
    console.log(`[Copy Prompt] Copying prompt for page ${currentPageNumber}, length: ${prompt.length}`);
    
    if (prompt) {
      try {
        // Run QA Theme Agent on first copy if book is created
        if (isBookCreated && createdBookId && !hasRunQaAgent) {
          setHasRunQaAgent(true);
          // Fire and forget - run in background, don't wait
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/qa-theme-agent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ bookId: createdBookId }),
          }).catch(error => {
            console.error('QA Theme Agent error (non-blocking):', error);
          });
        }

        // Strip title header before copying to prevent AI from adding text to images
        const cleanPrompt = stripTitleFromPrompt(prompt);
        await copyToClipboard(cleanPrompt);
        setShowConfirmation(true);
      
        // Mark this page as copied
        setCopiedPages(prev => new Set(prev).add(currentPageNumber));

        // Create book immediately if not already created
        if (!isBookCreated && !createBookMutation.isPending) {
          onCreateBook();
        }

        // Transition to upload after 5 seconds
        setTimeout(() => {
          setShowConfirmation(false);
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
              {currentPageNumber === 1 
                ? 'Page 1: Cover' 
                : currentPageNumber === 2
                ? 'Page 2: Educational Focus'
                : getCurrentPageTitle?.(currentPageNumber) || `Page ${currentPageNumber}`
              }
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {(() => {
                const prompt = getCurrentPagePrompt(currentPageNumber);
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
          onClick={handleClose}
          className="h-8 w-8"
          aria-label="Close review panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Image Upload/Display Area */}
        <div className="space-y-2" key={`page-${currentPageNumber}-${imageMode}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Page Image</p>
            <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
              <button 
                onClick={() => setImageMode('text')}
                className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                  imageMode === 'text' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📝 Text
                {hasTextImage && <span className="text-green-500 ml-0.5">✓</span>}
              </button>
              <button 
                onClick={() => setImageMode('color')}
                className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                  imageMode === 'color' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🎨 Color
                {hasColorImage && <span className="text-green-500 ml-0.5">✓</span>}
              </button>
              <button 
                onClick={() => setImageMode('bw')}
                className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                  imageMode === 'bw' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ⬜ B&W
                {hasBwImage && <span className="text-green-500 ml-0.5">✓</span>}
              </button>
            </div>
          </div>
          <div className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-primary/30 bg-muted/30">
            {currentPageImage && !isReplacing ? (
              <div className="relative w-full h-full group">
                <BookImage
                  src={currentPageImage} 
                  alt={`Page ${currentPageNumber} preview`}
                  className="w-full h-full object-contain"
                  priority={true}
                  enableMobileSave={true}
                  disableHoverEffects={true}
                />
                
                {/* Interactive Text Overlay - only show for content pages when not hidden and NOT in text image mode */}
                {imageMode !== 'text' && shouldShowTextOverlay && currentPageId && !isOverlayHidden(currentPageId) && currentPageText && (
                  <>
                    {isEditingOverlayText && onUpdatePageText ? (
                      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm px-4 py-3">
                        <InlineEditInput
                          value={currentPageText}
                          onSave={handleSaveOverlayText}
                          isEditing={true}
                        />
                      </div>
                    ) : (
                      <div 
                        className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm px-4 group overflow-hidden h-[40px]"
                      >
                        <div className="flex items-center justify-center gap-2 h-full relative">
                          <div 
                            onClick={() => onUpdatePageText && setIsEditingOverlayText(true)}
                            className={`flex items-center justify-center gap-2 flex-1 ${onUpdatePageText ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
                            title={onUpdatePageText ? "Click to edit text" : undefined}
                          >
                            <p className="text-white text-center font-semibold text-lg line-clamp-2">
                              {currentPageText}
                            </p>
                            {onUpdatePageText && (
                              <Pencil className="h-4 w-4 text-white/60 group-hover:text-white/90 transition-colors flex-shrink-0" />
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentPageId) {
                                toggleOverlay(currentPageId);
                              }
                            }}
                            className="h-6 w-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                            title="Hide text overlay"
                          >
                            <X className="h-3.5 w-3.5 text-white/70" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (!currentPageImage) return;
                      setIsCopyingImage(true);
                      try {
                        await copyImageToClipboard(currentPageImage);
                        toast({ title: "Image copied!", description: "Paste it anywhere" });
                      } catch (error) {
                        console.error('Failed to copy image:', error);
                        toast({ title: "Copy failed", description: "Could not copy image to clipboard", variant: "destructive" });
                      } finally {
                        setIsCopyingImage(false);
                      }
                    }}
                    disabled={isCopyingImage}
                    className="text-xs h-7"
                  >
                    {isCopyingImage ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" />Copy</>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsReplacing(true)}
                    className="text-xs h-7"
                  >
                    Replace
                  </Button>
                </div>
                
                
                {/* Show/Hide Overlay buttons - only for content pages and NOT in text mode */}
                {imageMode !== 'text' && shouldShowTextOverlay && currentPageId && isOverlayHidden(currentPageId) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (!isToggling) {
                        toggleOverlay(currentPageId);
                      }
                    }}
                    disabled={isToggling}
                    className="absolute top-11 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                  >
                    Show Overlay
                  </Button>
                )}
                
                {/* Hide Overlay button when overlay is shown - only for content pages and NOT in text mode */}
                {imageMode !== 'text' && shouldShowTextOverlay && currentPageId && !isOverlayHidden(currentPageId) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (!isToggling) {
                        toggleOverlay(currentPageId);
                      }
                    }}
                    disabled={isToggling}
                    className="absolute top-11 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                  >
                    Hide Overlay
                  </Button>
                )}
              </div>
            ) : isReplacing ? (
              <div className="relative w-full h-full">
                <ImageUpload 
                  onImageSelect={(file) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      onImageUpload(reader.result as string, imageMode);
                      setIsReplacing(false);
                    };
                    reader.readAsDataURL(file);
                  }}
                  disabled={createBookMutation.isPending}
                  className="h-full"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsReplacing(false)}
                  className="absolute top-2 right-2 text-xs h-7"
                >
                  Cancel
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
            ) : !hasSeenOnboarding ? (
              <button
                onClick={handleCopyPrompt}
                className="w-full h-full flex flex-col items-center justify-center p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Copy className="h-8 w-8 text-foreground" />
                </div>
                <p className="text-base font-semibold mb-2">Copy Image Prompt</p>
                <p className="text-xs text-muted-foreground">
                  Click to copy prompt for AI Studio
                </p>
              </button>
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
            ) : imageMode === 'text' && hasColorImage ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <Button
                  onClick={handleGenerateTextImage}
                  size="lg"
                  className="gap-2"
                  disabled={isGeneratingTextImage}
                >
                  <Sparkles className="h-5 w-5" />
                  {isGeneratingTextImage ? 'Generating...' : 'Generate Text Image'}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Adds text overlay to your color image
                </p>
              </div>
            ) : (
              <ImageUpload 
                onImageSelect={(file) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    onImageUpload(reader.result as string, imageMode);
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
                  />
                )}
              </div>
              
              {/* Generate Thumbnail Button */}
              {bookTitle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateThumbnail}
                  disabled={isGeneratingThumbnail || createBookMutation.isPending}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {isGeneratingThumbnail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isGeneratingThumbnail ? 'Generating...' : 'Generate Image'}
                </Button>
              )}
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
                size="lg"
                onClick={() => navigate(`/books/${bookId}/read`)}
                className="flex-1"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Read
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
            disabled={currentPageNumber === 1}
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
            disabled={currentPageNumber === pageCount}
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
