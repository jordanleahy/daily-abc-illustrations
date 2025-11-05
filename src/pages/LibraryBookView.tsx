import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { reorderPagesFromStartingLetter } from '@/utils/pageNavigation';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedOpenGraph } from '@/hooks/useDailyPublishedOpenGraph';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { useDailyPublishedImagePreloader } from '@/hooks/useDailyPublishedImagePreloader';
import { useReadingSessionAnalytics } from '@/hooks/useReadingSessionAnalytics';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useKidCoins } from '@/hooks/useKidCoins';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';
import { useCompleteBookHabit } from '@/hooks/useCompleteBookHabit';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { trackBookView } from '@/utils/bookViewTracking';
import { toast } from 'sonner';
import { MetaHead } from '@/components/common';
import { ReadingHeader } from '@/components/layout/ReadingHeader';
import { PublicPageImage } from '@/components/daily-published';
import { Card } from '@/components/ui/card';
import { processImage } from '@/utils/imageProcessor';
import { BottomSlideNavigation } from '@/components/ui/bottom-slide-navigation';
import { SwipeUpDrawer } from '@/components/ui/swipe-up-drawer';
import { RewardContainer } from '@/components/ui/reward-container';
import { UpcomingBooksPreview } from '@/components/daily-published';
import { RoleDebugger } from '@/components/RoleDebugger';
import { Calendar, Clock } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';
import { isValidUUID } from '@/utils/uuid';

export default function LibraryBookView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const safeId = id && isValidUUID(id) ? id : undefined;
  const { data: dailyContent, isLoading: isLoadingDaily, error: dailyError } = useLibraryBookById(safeId);
  const { startSession, trackPageView, endSession } = useReadingSessionAnalytics();
  const { data: kidProfiles } = useKidProfiles();
  const { completeBookHabit } = useCompleteBookHabit();
  const { hasHabitsRewards } = useFeatureAccess();
  
  const { data: pages = [], isLoading: isLoadingPages } = useDailyPublishedPages(dailyContent?.book_id);
  
  // Track book view when page loads
  useEffect(() => {
    if (dailyContent?.id && user) {
      trackBookView(dailyContent.id);
    }
  }, [dailyContent?.id, user]);
  
  // Get starting page index from location state (from UserLibraryDetail)
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
  
  // Auto-select kid if only one exists
  const selectedKidId = kidProfiles?.length === 1 ? kidProfiles[0].id : undefined;
  const { addCoins, isAddingCoins } = useKidCoins(selectedKidId);
  
  // Get upload function for current page (must be called before any early returns)
  const { uploadImage } = usePageImageUrls(uploadingForPageId || '');
  
  // Prefetch all page images in the background for instant navigation
  useDailyPublishedImagePreloader(reorderedPages, dailyContent?.book_id);
  
  const isLastPage = currentPageIndex === reorderedPages.length - 1;
  
  // Generate OpenGraph metadata for the current page
  const { openGraphMetadata } = useDailyPublishedOpenGraph(safeId, currentPageIndex);

  const isLoading = isLoadingDaily || isLoadingPages;

  // Start analytics session when content loads
  useEffect(() => {
    if (dailyContent && reorderedPages.length > 0 && !sessionStarted) {
      const entryPoint = location.state?.from === 'user-library-detail' ? 'reading_view_button' : 'library_card';
      
      startSession({
        contentType: 'library_book',
        contentId: dailyContent.id,
        bookId: dailyContent.book_id,
        totalPages: reorderedPages.length,
        entryPoint,
        startingPage: startingPageIndex + 1,
      });
      
      setSessionStarted(true);
    }
  }, [dailyContent, reorderedPages, sessionStarted, startSession, location.state, startingPageIndex]);

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
    navigate('/library');
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

  if (dailyError || !dailyContent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
        <ReadingHeader title="Library" onBack={handleBack} showQRCode={false} />
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Book Not Found</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              This book could not be found in your library.
            </p>
            {dailyError && (
              <p className="text-sm text-destructive">
                Error: {dailyError.message}
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
        <ReadingHeader title="Library" onBack={handleBack} showQRCode={false} />
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold">{dailyContent.title}</h2>
            <p className="text-sm text-muted-foreground">
              This publication doesn't have any pages to display.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const currentPage = reorderedPages[currentPageIndex];

  const handleNext = async () => {
    if (isLastPage) {
      // Auto-complete reading habit if exists (only for Plus tier users)
      if (hasHabitsRewards && selectedKidId && dailyContent?.book_id) {
        await completeBookHabit({
          bookId: dailyContent.book_id,
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

  // Header arrow navigation (no rewards)
  const handleHeaderPrevious = () => {
    if (currentPageIndex > 0) {
      const newIndex = currentPageIndex - 1;
      setCurrentPageIndex(newIndex);
      
      if (sessionStarted && reorderedPages[newIndex]) {
        trackPageView(newIndex + 1, reorderedPages[newIndex].letter, 'header_previous_arrow');
      }
    }
  };

  const handleHeaderNext = () => {
    if (currentPageIndex < reorderedPages.length - 1) {
      const newIndex = currentPageIndex + 1;
      setCurrentPageIndex(newIndex);
      
      if (sessionStarted && reorderedPages[newIndex]) {
        trackPageView(newIndex + 1, reorderedPages[newIndex].letter, 'header_next_arrow');
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
    if (!file || !uploadingForPageId || !dailyContent) return;
    
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

      // Upload
      await uploadImage(compressedFile, dailyContent.book_id);
      
      // Success
      toast.success('Image uploaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.', { id: toastId });
    } finally {
      setUploadingForPageId(null);
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
      {/* Dynamic meta tags for social sharing */}
      {openGraphMetadata && <MetaHead metadata={openGraphMetadata} />}
      
      <div className="flex flex-col h-screen" style={{ touchAction: 'none' }}>
        <ReadingHeader 
          title={dailyContent.title}
          subtitle={`${currentPageIndex + 1} of ${reorderedPages.length}`}
          bookId={dailyContent.book_id}
          onBack={handleBack}
          kidId={selectedKidId}
          onPrevious={handleHeaderPrevious}
          onNext={handleHeaderNext}
          hasPrevious={currentPageIndex > 0}
          hasNext={currentPageIndex < reorderedPages.length - 1}
        />
        
        {/* Reward System */}
        <div className="pt-20 pb-2">
          <RewardContainer earnedRewards={earnedRewards} />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col pb-4">
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm mx-auto shadow-lg">
              <PublicPageImage 
                pageId={currentPage.id}
                bookId={dailyContent.book_id}
                className="rounded-lg"
                showUploadButton={false}
                onUploadClick={handleUploadClick}
              />
            </Card>
          </div>
          
          {/* Navigation */}
          <BottomSlideNavigation 
            onSlide={handleNext}
            disabled={isAddingCoins}
            variant="compact"
            slideText={isLastPage ? "Finish & Collect Coins" : undefined}
          />
        </div>
      </div>
      
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