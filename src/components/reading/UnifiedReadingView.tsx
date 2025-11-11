import { useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { reorderPagesFromStartingLetter } from '@/utils/pageNavigation';
import { useReadingSessionAnalytics } from '@/hooks/useReadingSessionAnalytics';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useKidCoins } from '@/hooks/useKidCoins';
import { useCompleteBookHabit } from '@/hooks/useCompleteBookHabit';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useBookPages } from '@/hooks/useBookPages';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';
import { toast } from 'sonner';
import { MetaHead } from '@/components/common';
import { ReadingHeader } from '@/components/layout/ReadingHeader';
import { Card } from '@/components/ui/card';
import { ReadingPageDisplay, useReadingPageState, UnifiedReadingControls } from '@/components/reading';
import { RewardContainer } from '@/components/ui/reward-container';
import { processImage } from '@/utils/imageProcessor';
import type { Page } from '@/types/book';
import type { SEOMetadata } from '@/types/openGraph';

export interface UnifiedReadingViewConfig {
  // Content type for analytics
  contentType: 'library_book' | 'user_book' | 'daily_published';
  
  // Book and page data
  book: {
    id: string;
    book_id?: string;
    book_name?: string;
    title?: string;
    book_description?: string;
  };
  pages: Page[];
  
  // Navigation
  startingPageIndex?: number;
  onBack: () => void;
  backLabel?: string;
  
  // Features
  showUploadButton?: boolean;
  showSwipeDrawer?: boolean;
  
  // Custom components
  customHeader?: ReactNode;
  imageComponent?: (page: Page, pageIndex: number) => ReactNode;
  drawerContent?: (page: Page) => ReactNode;
  
  // Analytics
  entryPoint?: 'direct_link' | 'homepage_redirect' | 'library_card' | 'reading_view_button';
  
  // Metadata
  openGraphMetadata?: SEOMetadata;
  
  // Session rewards (for non-authenticated users)
  sessionCoins?: number;
}

export function UnifiedReadingView({
  contentType,
  book,
  pages,
  startingPageIndex = 0,
  onBack,
  backLabel,
  showUploadButton = false,
  showSwipeDrawer = false,
  customHeader,
  imageComponent,
  drawerContent,
  entryPoint = 'direct_link',
  openGraphMetadata,
  sessionCoins = 0,
}: UnifiedReadingViewConfig) {
  const navigate = useNavigate();
  const { startSession, trackPageView, endSession } = useReadingSessionAnalytics();
  const { data: kidProfiles } = useKidProfiles();
  const { completeBookHabit } = useCompleteBookHabit();
  const { hasHabitsRewards } = useFeatureAccess();
  
  // Reorder pages for circular reading experience
  const reorderedPages = useMemo(() => {
    if (!pages.length || startingPageIndex === 0) return pages;
    return reorderPagesFromStartingLetter(pages, startingPageIndex);
  }, [pages, startingPageIndex]);
  
  // State management
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [earnedRewards, setEarnedRewards] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [uploadingForPageId, setUploadingForPageId] = useState<string | null>(null);
  const [initialPageTracked, setInitialPageTracked] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Word learning state
  const readingState = useReadingPageState();
  
  // Auto-select kid if only one exists
  const selectedKidId = kidProfiles?.length === 1 ? kidProfiles[0].id : undefined;
  const { addCoins, isAddingCoins } = useKidCoins(selectedKidId);
  
  // Get current page and related data
  const currentPage = reorderedPages[currentPageIndex];
  const isLastPage = currentPageIndex === reorderedPages.length - 1;
  
  // Get upload function for current page (if enabled)
  const { uploadImage } = usePageImageUrls(showUploadButton ? (currentPage?.id || '') : '');
  
  // Get current page words for word learning
  const { pages: bookPages } = useBookPages(book.book_id || book.id);
  const currentPageWords = useMemo(() => {
    const page = bookPages?.find(p => p.id === currentPage?.id);
    return page?.content?.words || [];
  }, [bookPages, currentPage]);
  
  // Reset word learning state when page changes
  useEffect(() => {
    readingState.resetState();
  }, [currentPageIndex]);
  
  // Start analytics session when content loads
  useEffect(() => {
    if (book && reorderedPages.length > 0 && !sessionStarted) {
      startSession({
        contentType,
        contentId: book.id,
        bookId: book.book_id || book.id,
        totalPages: reorderedPages.length,
        entryPoint,
        startingPage: startingPageIndex + 1,
      });
      
      setSessionStarted(true);
    }
  }, [book, reorderedPages, sessionStarted, startSession, contentType, entryPoint, startingPageIndex]);
  
  // Track initial page view once session starts
  useEffect(() => {
    if (sessionStarted && reorderedPages.length > 0 && !initialPageTracked) {
      const currentPage = reorderedPages[currentPageIndex];
      if (currentPage) {
        trackPageView(currentPageIndex + 1, currentPage.letter, 'session_start');
        setInitialPageTracked(true);
      }
    }
  }, [sessionStarted, reorderedPages, currentPageIndex, trackPageView, initialPageTracked]);
  
  // Navigation handlers
  const handleNext = async () => {
    if (isLastPage) {
      // Auto-complete reading habit if exists (only for Plus tier users)
      if (hasHabitsRewards && selectedKidId && (book.book_id || book.id)) {
        await completeBookHabit({
          bookId: book.book_id || book.id,
          kidProfileId: selectedKidId,
        });
      }

      // User finished the book - ONLY deposit coins for Plus tier users
      if (hasHabitsRewards && selectedKidId && earnedRewards > 0) {
        try {
          await addCoins({ 
            kidId: selectedKidId, 
            coinsToAdd: earnedRewards 
          });
          
          toast.success(`You earned ${earnedRewards} coins! 🎉`, {
            description: "Great job reading!",
          });
          
          endSession('book_completed');
          onBack();
        } catch (error) {
          console.error('Failed to deposit coins:', error);
          toast.error("Couldn't save your coins. Try again.");
        }
      } else {
        // No kid selected or no rewards access - just navigate back
        endSession('book_completed');
        onBack();
      }
    } else {
      // Normal page navigation - ALWAYS show visual reward animation
      const newIndex = currentPageIndex + 1;
      setCurrentPageIndex(newIndex);
      setEarnedRewards(prev => prev + 1);
      
      if (sessionStarted && reorderedPages[newIndex]) {
        trackPageView(newIndex + 1, reorderedPages[newIndex].letter, 'next_swipe');
      }
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      const newIndex = currentPageIndex - 1;
      setCurrentPageIndex(newIndex);
      
      // Track page view
      if (sessionStarted && reorderedPages[newIndex]) {
        trackPageView(newIndex + 1, reorderedPages[newIndex].letter, 'previous_swipe');
      }
    }
  };

  const handleBack = () => {
    endSession('back_button');
    onBack();
  };

  // Image upload handlers
  const validateImage = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please select an image file' };
    }
    
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: 'Supported formats: PNG, JPG, WEBP' };
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'Image must be smaller than 5MB' };
    }
    
    const isSquare = await checkAspectRatio(file);
    if (!isSquare) {
      return { valid: false, error: 'Image must have a 1:1 aspect ratio (square)' };
    }
    
    return { valid: true };
  };

  const checkAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const isSquare = Math.abs(aspectRatio - 1) < 0.1;
        URL.revokeObjectURL(img.src);
        resolve(isSquare);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPage || !book) return;
    
    const validation = await validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid image');
      setUploadingForPageId(null);
      return;
    }
    
    const toastId = toast.loading('Uploading image...');
    
    try {
      const processed = await processImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        targetSizeBytes: 500 * 1024,
        quality: 0.85,
      });

      const compressedFile = new File(
        [processed.blob],
        file.name.replace(/\.[^.]+$/, '.webp'),
        { type: processed.blob.type }
      );

      await uploadImage(compressedFile, book.book_id || book.id);
      
      toast.success('Image uploaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.', { id: toastId });
    } finally {
      setUploadingForPageId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    if (currentPage) {
      setUploadingForPageId(currentPage.id);
      fileInputRef.current?.click();
    }
  };

  if (!currentPage) {
    return null;
  }

  const bookTitle = book.book_name || book.title || 'Book';
  const displayRewards = sessionCoins > 0 ? sessionCoins : earnedRewards;

  return (
    <div className="min-h-screen bg-background">
      {openGraphMetadata && <MetaHead metadata={openGraphMetadata} />}
      
      <div className="flex flex-col h-screen" style={{ touchAction: 'none' }}>
        {customHeader || (
          <ReadingHeader 
            title={bookTitle}
            subtitle={`${currentPageIndex + 1} of ${reorderedPages.length}`}
            onBack={handleBack}
            kidId={selectedKidId}
            showQRCode={false}
            backLabel={backLabel}
            bookId={book.book_id || book.id}
          />
        )}
        
        {/* Reward System */}
        <div className="pt-20 pb-2">
          <RewardContainer earnedRewards={displayRewards} />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col pb-24">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-sm mx-auto">
              <ReadingPageDisplay
                pageId={currentPage.id}
                bookId={book.book_id || book.id}
                pageNumber={currentPage.page_number}
                pageText={currentPage.content?.textOverlay?.enabled ? currentPage.content.textOverlay.text : ''}
                imageUrl=""
                currentWordIndex={readingState.currentWordIndex}
                isWordEnlarged={readingState.isWordEnlarged}
                wordStatuses={readingState.wordStatuses}
                hiddenOverlayPages={readingState.hiddenOverlayPages}
                onToggleOverlayVisibility={readingState.toggleOverlayVisibility}
                 isPreferencesLoading={readingState.isPreferencesLoading}
                 showDismissButton={false}
                 imageComponent={imageComponent ? imageComponent(currentPage, currentPageIndex) : undefined}
              />
            </div>
          </div>
          
          {/* Optional drawer content */}
          {showSwipeDrawer && drawerContent && drawerContent(currentPage)}
        </div>
      </div>
      
      {/* Unified Reading Controls */}
      <UnifiedReadingControls
        showWordControls={contentType === 'user_book' ? currentPageIndex > 1 : undefined}
        hasWords={currentPageWords.length > 0}
        isEnlarged={readingState.isWordEnlarged}
        onMarkDifficult={() => readingState.handleMarkDifficult(currentPageWords.length)}
        onMarkUnderstood={() => readingState.handleMarkUnderstood(currentPageWords.length)}
        currentWordIndex={readingState.currentWordIndex}
        totalWords={currentPageWords.length}
        onNavigateWord={(dir) => readingState.handleNavigateWord(dir, currentPageWords.length)}
        onPreviousPage={handlePrevious}
        onNextPage={handleNext}
        disablePreviousPage={currentPageIndex === 0}
        disableNextPage={isAddingCoins}
      />
      
      {/* Hidden file input for uploads */}
      {showUploadButton && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}
    </div>
  );
}
