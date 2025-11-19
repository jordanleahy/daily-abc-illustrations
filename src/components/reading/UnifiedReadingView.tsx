/**
 * ============================================================================
 * UNIFIED READING VIEW - SHARED COMPONENT
 * ============================================================================
 * 
 * ⚠️ CRITICAL: This component is used by ALL THREE reading views:
 * 1. BookReadingView (src/pages/BookReadingView.tsx) - User's personal books
 * 2. LibraryBookView (src/pages/LibraryBookView.tsx) - Library books
 * 3. DailyPublishedPageView (src/components/daily-published/DailyPublishedPageView.tsx) - Daily content
 * 
 * ANY CHANGES TO THIS COMPONENT WILL AFFECT ALL THREE VIEWS!
 * 
 * ============================================================================
 * COMPONENT PURPOSE
 * ============================================================================
 * Provides a consistent, read-only reading experience across the entire app with:
 * - Page navigation (swipe/button controls)
 * - Word learning features (highlight, mark difficult/understood)
 * - Analytics tracking (sessions, page views)
 * - Rewards system (coins for reading progress)
 * - Text overlay support (for ABC books)
 * - Custom headers (timer for daily published)
 * - Tap-to-advance (daily published only)
 * - Content expiration (daily published only)
 * 
 * ============================================================================
 * DESIGN DECISIONS
 * ============================================================================
 * - All views are READ-ONLY (no upload buttons, no editing)
 * - No dismiss button on text overlays (editor-only feature)
 * - No swipe drawer (kept minimal for consistent UX)
 * - Shared navigation, word learning, and analytics logic
 * 
 * ============================================================================
 * BEFORE MAKING CHANGES
 * ============================================================================
 * 1. Test changes in ALL THREE views:
 *    - /books/:id (BookReadingView)
 *    - /library/:id (LibraryBookView)
 *    - / (DailyPublishedPageView - homepage daily content)
 * 
 * 2. Consider if your change should apply to all views or just one:
 *    - If ONE view only: Add a new prop with conditional logic
 *    - If ALL views: Make the change directly
 * 
 * 3. Check these features still work:
 *    - Navigation (previous/next page)
 *    - Word learning (enlarge, mark difficult/understood)
 *    - Analytics (session tracking)
 *    - Rewards (coins display)
 *    - Text overlays (show/hide, no dismiss button)
 *    - Custom headers (especially timer for daily published)
 *    - Expiration (daily published auto-redirect)
 *    - Tap-to-advance (daily published)
 * 
 * ============================================================================
 */

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { reorderPagesFromStartingLetter } from '@/utils/pageNavigation';
import { useReadingSessionAnalytics } from '@/hooks/useReadingSessionAnalytics';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useKidCoins } from '@/hooks/useKidCoins';
import { useCompleteBookHabit } from '@/hooks/useCompleteBookHabit';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
// Toast notifications removed
import { MetaHead } from '@/components/common';
import { ReadingHeader } from '@/components/layout/ReadingHeader';
import { ReadingPageDisplay, useReadingPageState, UnifiedReadingControls } from '@/components/reading';
import { RewardContainer } from '@/components/ui/reward-container';
import type { Page } from '@/types/book';
import { isContentPage } from '@/types/book';
import type { SEOMetadata } from '@/types/openGraph';

/**
 * Configuration interface for UnifiedReadingView
 * 
 * This interface defines all possible configuration options for the reading view.
 * Different views use different subsets of these props to customize behavior.
 */
export interface UnifiedReadingViewConfig {
  /** Analytics identifier for tracking different content types */
  contentType: 'library_book' | 'user_book' | 'daily_published';
  
  /** Book metadata for display and analytics */
  book: {
    id: string;
    book_id?: string;
    book_name?: string;
    name?: string;
    title?: string;
    book_description?: string;
    category?: string;
  };
  
  /** Array of pages to display. Daily published passes single page, others pass full book */
  pages: Page[];
  
  // ========== Navigation ==========
  /** Which page to start on (0-indexed). Default: 0 */
  startingPageIndex?: number;
  
  /** Called when user presses back button */
  onBack: () => void;
  
  /** Custom label for back button. Default: "Back" */
  backLabel?: string;
  
  /** Custom next page handler. If provided, overrides default navigation (used by DailyPublishedPageView) */
  onNext?: () => void;
  
  /** Custom previous page handler. If provided, overrides default navigation (used by DailyPublishedPageView) */
  onPrevious?: () => void;
  
  // ========== Features (Currently Disabled) ==========
  /** Upload button visibility. Currently always false (all views are read-only) */
  showUploadButton?: boolean;
  
  /** Swipe drawer visibility. Currently always false for consistent UX */
  showSwipeDrawer?: boolean;
  
  // ========== Custom Components ==========
  /** Custom header component. Used by DailyPublishedPageView for timer header */
  customHeader?: ReactNode;
  
  /** Custom image renderer. All views pass PublicPageImage component */
  imageComponent?: (page: Page, pageIndex: number) => ReactNode;
  
  /** Custom drawer content. Currently unused (showSwipeDrawer is false) */
  drawerContent?: (page: Page) => ReactNode;
  
  // ========== Analytics ==========
  /** How user accessed this content (for analytics tracking) */
  entryPoint?: 'direct_link' | 'homepage_redirect' | 'library_card' | 'reading_view_button';
  
  // ========== SEO & Metadata ==========
  /** OpenGraph metadata for social sharing */
  openGraphMetadata?: SEOMetadata;
  
  // ========== Rewards ==========
  /** Display session coins for non-authenticated users (daily published) */
  sessionCoins?: number;
  
  // ========== Daily Published Features ==========
  /** Expiration timestamp. When reached, redirects to homepage (daily published only) */
  expiresAt?: string;
  
  /** Enable tap-to-advance on page image (daily published only) */
  onTapToAdvance?: boolean;
  
  /** Daily published content ID for tracking (daily published only) */
  contentId?: string;
}

/**
 * UnifiedReadingView - The shared reading component
 * 
 * ⚠️ Used by BookReadingView, LibraryBookView, and DailyPublishedPageView
 * 
 * Handles all reading logic including:
 * - Page navigation with circular reordering
 * - Word learning features (enlarge, mark status)
 * - Analytics session tracking
 * - Rewards system (coins for progress)
 * - Text overlay display (no dismiss button in reader mode)
 * - Content expiration (daily published)
 * - Custom navigation handlers (daily published)
 */

export function UnifiedReadingView({
  contentType,
  book,
  pages,
  startingPageIndex = 0,
  onBack,
  backLabel,
  onNext: customOnNext,
  onPrevious: customOnPrevious,
  showUploadButton = false,
  showSwipeDrawer = false,
  customHeader,
  imageComponent,
  drawerContent,
  entryPoint = 'direct_link',
  openGraphMetadata,
  sessionCoins = 0,
  expiresAt,
  onTapToAdvance = false,
  contentId,
}: UnifiedReadingViewConfig) {
  const navigate = useNavigate();
  const { startSession, trackPageView, endSession } = useReadingSessionAnalytics();
  const { data: kidProfiles } = useKidProfiles();
  const { completeBookHabit } = useCompleteBookHabit();
  const { hasHabitsRewards } = useFeatureAccess();
  
  // Handle expiration for daily published content
  const isExpired = expiresAt ? new Date() > new Date(expiresAt) : false;
  
  useEffect(() => {
    if (isExpired) {
      console.log('Content has expired, redirecting to home...');
      navigate('/', { replace: true });
    }
  }, [isExpired, navigate]);
  
  // Reorder pages for circular reading experience
  const reorderedPages = useMemo(() => {
    if (!pages.length || startingPageIndex === 0) return pages;
    return reorderPagesFromStartingLetter(pages, startingPageIndex);
  }, [pages, startingPageIndex]);
  
  // State management
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [earnedRewards, setEarnedRewards] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [initialPageTracked, setInitialPageTracked] = useState(false);
  
  // Per-page word learning state persistence
  const [pageWordStates, setPageWordStates] = useState<Record<string, {
    currentWordIndex: number;
    wordStatuses: Record<number, 'difficult' | 'understood'>;
  }>>({});
  
  // Auto-select kid if only one exists
  const selectedKidId = kidProfiles?.length === 1 ? kidProfiles[0].id : undefined;
  const { addCoins, isAddingCoins } = useKidCoins(selectedKidId);
  
  // Get current page and related data
  const currentPage = reorderedPages[currentPageIndex];
  const isLastPage = currentPageIndex === reorderedPages.length - 1;
  
  // Get current page words for word learning (use pages prop, no need to refetch)
  const currentPageWords = useMemo(() => {
    const page = pages.find(p => p.id === currentPage?.id);
    return page?.content?.words || [];
  }, [pages, currentPage]);
  
  // Word learning state with tracking config and restored state
  const savedState = currentPage?.id ? pageWordStates[currentPage.id] : undefined;
  const readingState = useReadingPageState({
    kidProfileId: selectedKidId,
    bookId: book.book_id || book.id,
    pageId: currentPage?.id,
    pageTitle: currentPage?.title,
    words: currentPageWords,
    initialWordIndex: savedState?.currentWordIndex,
    initialWordStatuses: savedState?.wordStatuses,
  });
  
  // Save word learning state when page changes
  useEffect(() => {
    if (!currentPage?.id) return;
    
    // Save state when moving to a new page
    const saveState = () => {
      if (currentPage.id) {
        setPageWordStates(prev => ({
          ...prev,
          [currentPage.id]: {
            currentWordIndex: readingState.currentWordIndex,
            wordStatuses: readingState.wordStatuses,
          }
        }));
      }
    };
    
    // Save on page change
    return saveState;
  }, [currentPage?.id, readingState.currentWordIndex, readingState.wordStatuses]);
  
  // Start analytics session when content loads
  useEffect(() => {
    if (book && reorderedPages.length > 0 && !sessionStarted) {
      startSession({
        contentType,
        contentId: book.id,
        bookId: book.book_id || book.id,
        bookName: book.name || book.book_name,
        category: book.category,
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
    // Use custom handler if provided (for daily published)
    if (customOnNext) {
      customOnNext();
      return;
    }
    
    // Default navigation logic
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
          
          console.log(`You earned ${earnedRewards} coins! 🎉 - Great job reading!`);
          
          endSession('book_completed');
          onBack();
        } catch (error) {
          console.error('Failed to deposit coins:', error);
          console.error("Couldn't save your coins. Try again.");
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
    // Use custom handler if provided (for daily published)
    if (customOnPrevious) {
      customOnPrevious();
      return;
    }
    
    // Default navigation logic
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

  // Tap-to-advance handler for daily published
  const handleTapToAdvance = onTapToAdvance ? (e: React.MouseEvent) => {
    // Allow context menu to work on image
    if (e.button === 2) return;
    handleNext();
  } : undefined;

  if (!currentPage || isExpired) {
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
        <div className="flex-1 flex flex-col items-center justify-center pb-64 p-4">
          <div 
            className="w-full max-w-sm mx-auto"
            onClick={handleTapToAdvance}
            style={onTapToAdvance ? { cursor: 'pointer' } : undefined}
          >
            <ReadingPageDisplay
              pages={pages}
              pageId={currentPage.id}
              bookId={book.book_id || book.id}
              pageNumber={currentPage.page_number}
              pageText={currentPage.title || ''}
              imageUrl=""
              pageType={currentPage.page_type}
              currentWordIndex={readingState.currentWordIndex}
              wordStatuses={readingState.wordStatuses}
              hiddenOverlayPages={readingState.hiddenOverlayPages}
              onToggleOverlayVisibility={readingState.toggleOverlayVisibility}
              isPreferencesLoading={readingState.isPreferencesLoading}
              showDismissButton={false}
              imageComponent={imageComponent ? imageComponent(currentPage, currentPageIndex) : undefined}
              hideBottomOverlay={true}
            />
            </div>
          </div>
          
          {/* Optional drawer content */}
          {showSwipeDrawer && drawerContent && drawerContent(currentPage)}
        </div>
      
      {/* Unified Reading Controls - Always show navigation, word controls only on content pages */}
        <UnifiedReadingControls
          pageType={currentPage.page_type}
          showWordControls={isContentPage(currentPage)}
          hasWords={currentPageWords.length > 0}
          onMarkDifficult={() => readingState.handleMarkDifficult(currentPageWords.length)}
          onMarkUnderstood={() => readingState.handleMarkUnderstood(currentPageWords.length)}
          currentWordIndex={readingState.currentWordIndex}
          totalWords={currentPageWords.length}
          onNavigateWord={(dir) => readingState.handleNavigateWord(dir, currentPageWords.length)}
          onPreviousPage={handlePrevious}
          onNextPage={handleNext}
          disablePreviousPage={currentPageIndex === 0}
          disableNextPage={isAddingCoins}
          overlayText={currentPage.title || ''}
          overlayWords={currentPageWords}
          overlayCurrentWordIndex={readingState.currentWordIndex}
          overlayWordStatuses={readingState.wordStatuses}
          showOverlay={!readingState.hiddenOverlayPages?.has(currentPage.id)}
          isReadMode={readingState.isReadMode}
          onToggleReadMode={readingState.toggleReadMode}
          isLastWord={readingState.currentWordIndex === currentPageWords.length - 1}
          hasReachedLastWord={readingState.hasReachedLastWord}
        />
    </div>
  );
}
