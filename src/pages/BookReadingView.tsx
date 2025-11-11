import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { reorderPagesFromStartingLetter } from '@/utils/pageNavigation';
import { useBook } from '@/hooks/useBook';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookEditorImagePreloader } from '@/hooks/useBookEditorImagePreloader';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { useReadingSessionAnalytics } from '@/hooks/useReadingSessionAnalytics';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useKidCoins } from '@/hooks/useKidCoins';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';
import { useCompleteBookHabit } from '@/hooks/useCompleteBookHabit';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MetaHead } from '@/components/common';
import { ReadingHeader } from '@/components/layout/ReadingHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookImage } from '@/components/ui/book-image';
import { ReadingPageDisplay, useReadingPageState, UnifiedReadingControls } from '@/components/reading';
import { processImage } from '@/utils/imageProcessor';
import { SwipeUpDrawer } from '@/components/ui/swipe-up-drawer';
import { RewardContainer } from '@/components/ui/reward-container';
import { RoleDebugger } from '@/components/RoleDebugger';
import { Calendar } from 'lucide-react';
import { isValidUUID } from '@/utils/uuid';

export default function BookReadingView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const safeId = id && isValidUUID(id) ? id : undefined;
  const { data: book, isLoading: isLoadingBook, error: bookError } = useBook(safeId);
  const { startSession, trackPageView, endSession } = useReadingSessionAnalytics();
  const { data: kidProfiles } = useKidProfiles();
  const { completeBookHabit } = useCompleteBookHabit();
  const { hasHabitsRewards } = useFeatureAccess();
  
  const { pages = [], loading: isLoadingPages } = useBookPages(safeId);
  const { data: pageImages = {} } = useBookPageImages(safeId);
  
  // Get starting page index from location state
  const startingPageIndex = location.state?.startingPageIndex ?? 0;
  
  // Reorder pages to create circular reading experience starting from chosen page
  const reorderedPages = useMemo(() => {
    if (!pages.length || startingPageIndex === 0) return pages;
    return reorderPagesFromStartingLetter(pages, startingPageIndex);
  }, [pages, startingPageIndex]);
  
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
  
  // Get upload function for current page only when needed
  const currentPage = reorderedPages[currentPageIndex];
  const { uploadImage } = usePageImageUrls(currentPage?.id || '');
  
  // Prefetch all page images in the background for instant navigation
  useBookEditorImagePreloader(pageImages);
  
  const isLastPage = currentPageIndex === reorderedPages.length - 1;
  const isLoading = isLoadingBook || isLoadingPages;
  
  // Get current page words for word learning (MUST be before early returns)
  const currentPageWords = useMemo(() => {
    const page = pages?.find(p => p.id === currentPage?.id);
    return page?.content?.words || [];
  }, [pages, currentPage]);
  
  // Reset word learning state when page changes
  useEffect(() => {
    readingState.resetState();
  }, [currentPageIndex]);

  useEffect(() => {
    console.log('[BookReadingView] Loading state', { isLoadingBook, isLoadingPages, hasBook: !!book, pagesCount: pages.length });
  }, [isLoadingBook, isLoadingPages, book, pages]);

  // Start analytics session when content loads
  useEffect(() => {
    if (book && reorderedPages.length > 0 && !sessionStarted) {
      const entryPoint = location.state?.from === 'library' ? 'library_card' : 'direct_link';
      
      startSession({
        contentType: 'user_book',
        contentId: book.id,
        bookId: book.id,
        totalPages: reorderedPages.length,
        entryPoint,
        startingPage: startingPageIndex + 1,
      });
      
      setSessionStarted(true);
    }
  }, [book, reorderedPages, sessionStarted, startSession, location.state, startingPageIndex]);

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

  const handleBack = () => {
    endSession('back_button');
    // If user came from Google Chat, navigate back to that specific session
    if (location.state?.from === 'google-chat') {
      const sessionId = location.state?.sessionId;
      if (sessionId) {
        navigate(`/google-chat?session=${sessionId}`);
      } else {
        navigate('/google-chat');
      }
    } else {
      navigate('/library');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (bookError || !book) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
        <ReadingHeader title="My Books" onBack={handleBack} showQRCode={false} />
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Book Not Found</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              This book could not be found in your library.
            </p>
            {bookError && (
              <p className="text-sm text-destructive">
                Error: {bookError.message}
              </p>
            )}
          </div>
        </Card>
        
        {/* Role debugger for troubleshooting */}
        <RoleDebugger />
      </div>
    );
  }

  if (!reorderedPages || reorderedPages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ReadingHeader title="My Books" onBack={handleBack} showQRCode={false} />
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold">{book.book_name}</h2>
            <p className="text-sm text-muted-foreground">
              This book doesn't have any pages to display.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // FIX: Access pageImages by page_number instead of page.id
  const currentImageUrl = currentPage ? pageImages[currentPage.page_number] : undefined;

  const handleNext = async () => {
    if (isLastPage) {
      // Auto-complete reading habit if exists (only for Plus tier users)
      if (hasHabitsRewards && selectedKidId && book?.id) {
        await completeBookHabit({
          bookId: book.id,
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
          navigate('/library');
        } catch (error) {
          console.error('Failed to deposit coins:', error);
          toast.error("Couldn't save your coins. Try again.");
        }
      } else {
        // No kid selected or no rewards access - just navigate back
        endSession('book_completed');
        navigate('/library');
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


  // Validate image file
  const validateImage = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Please select an image file' };
    }
    
    // Check supported formats
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: 'Supported formats: PNG, JPG, WEBP' };
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'Image must be smaller than 5MB' };
    }
    
    // Check aspect ratio
    const isSquare = await checkAspectRatio(file);
    if (!isSquare) {
      return { valid: false, error: 'Image must have a 1:1 aspect ratio (square)' };
    }
    
    return { valid: true };
  };

  // Check if image has 1:1 aspect ratio
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

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPage || !book) return;
    
    // Validate
    const validation = await validateImage(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid image');
      setUploadingForPageId(null);
      return;
    }
    
    // Show uploading toast
    const toastId = toast.loading('Uploading image...');
    
    try {
      // Process and compress image
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

      // Upload with pageId and bookId
      await uploadImage(compressedFile, book.id);
      
      // Success
      toast.success('Image uploaded successfully!', { id: toastId });
      setUploadingForPageId(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.', { id: toastId });
      setUploadingForPageId(null);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle upload button click - trigger file picker directly
  const handleUploadClick = () => {
    if (currentPage) {
      setUploadingForPageId(currentPage.id);
      fileInputRef.current?.click();
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic meta tags */}
      <MetaHead metadata={{
        title: `${book.book_name} - Reading`,
        description: book.book_description || `Read ${book.book_name}`,
        type: 'article'
      }} />
      
      <div className="flex flex-col h-screen" style={{ touchAction: 'none' }}>
        <ReadingHeader 
          title={book.book_name}
          subtitle={`${currentPageIndex + 1} of ${reorderedPages.length}`}
          bookId={book.id}
          showQRCode={false}
          onBack={handleBack}
          kidId={selectedKidId}
          backLabel={location.state?.from === 'google-chat' ? 'Chat' : 'Library'}
        />
        
        {/* Reward System */}
        <div className="pt-20 pb-2">
          <RewardContainer earnedRewards={earnedRewards} />
        </div>
        
          {/* Main content area */}
          <div className="flex-1 flex flex-col pb-24">
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-sm mx-auto">
                {currentImageUrl ? (
                  <ReadingPageDisplay
                    pageId={currentPage.id}
                    bookId={book.id}
                    pageNumber={currentPage.page_number}
                    pageText={currentPage?.content?.textOverlay?.enabled ? currentPage.content.textOverlay.text : ''}
                    imageUrl={currentImageUrl}
                    currentWordIndex={readingState.currentWordIndex}
                    isWordEnlarged={readingState.isWordEnlarged}
                    hiddenOverlayPages={readingState.hiddenOverlayPages}
                    wordStatuses={readingState.wordStatuses}
                    imageComponent={
                      <BookImage
                        src={currentImageUrl}
                        alt={currentPage?.content?.mainConcept || currentPage?.title || "Page illustration"}
                        priority={true}
                        className="w-full h-full object-cover object-top rounded-lg"
                      />
                    }
                  />
                ) : (
                  <Card className="shadow-lg">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-b from-muted to-muted/60 flex items-center justify-center">
                        <div className="text-center px-6">
                          <p className="text-sm font-semibold">{currentPage?.title || currentPage?.letter || 'Page'}</p>
                          <p className="text-xs text-muted-foreground mt-1">No image yet. Upload one to start reading.</p>
                          <Button className="mt-3" size="sm" variant="secondary" onClick={handleUploadClick}>
                            Upload image
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
            
            {/* Educational Content Drawer */}
            <SwipeUpDrawer>
              <div className="space-y-6 pb-6">
                {/* Page Content */}
                {currentPage?.content && (
                  <div className="space-y-4">
                    {currentPage.content.mainConcept && (
                      <div>
                        <h3 className="text-lg font-bold mb-2">Main Concept</h3>
                        <p className="text-muted-foreground">{currentPage.content.mainConcept}</p>
                      </div>
                    )}
                    
                    {currentPage.content.funFact && (
                      <div>
                        <h3 className="text-lg font-bold mb-2">Fun Fact</h3>
                        <p className="text-muted-foreground">{currentPage.content.funFact}</p>
                      </div>
                    )}
                    
                    {currentPage.content.activity && (
                      <div>
                        <h3 className="text-lg font-bold mb-2">Activity</h3>
                        <p className="text-muted-foreground">{currentPage.content.activity}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SwipeUpDrawer>
          </div>
        </div>
        
        {/* Unified Reading Controls */}
        <UnifiedReadingControls
          showWordControls={currentPageIndex > 1}
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
      
      {/* Hidden file input for direct upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
