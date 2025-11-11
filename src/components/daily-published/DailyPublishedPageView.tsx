import { Card, CardContent } from '@/components/ui/card';
import { PublicPageImage } from './PublicPageImage';
import { FreemiumHeader } from './FreemiumHeader';
import { ReadingPageDisplay, useReadingPageState, UnifiedReadingControls } from '@/components/reading';
import { RewardContainer } from '@/components/ui/reward-container';
import { formatTimeRemaining } from '@/utils/timeUtils';
import type { Page } from '@/types/book';
import type { SEOMetadata } from '@/types/openGraph';
import { useState, useEffect, useMemo } from 'react';
import { MetaHead } from '@/components/common';
import { useNavigate } from 'react-router-dom';
import { useBookPages } from '@/hooks/useBookPages';
interface DailyPublishedPageViewProps {
  page: Page;
  bookId: string;
  pageNumber: number;
  totalPages: number;
  previousPage?: Page;
  expiresAt: string;
  onNext: () => void;
  onPrevious?: () => void;
  /** OpenGraph metadata for this specific page view */
  openGraphMetadata?: SEOMetadata;
  /** Current daily published content ID for transition handling */
  contentId?: string;
  /** Session coins accumulated (not saved for non-auth users) */
  sessionCoins?: number;
}
export function DailyPublishedPageView({
  page,
  bookId,
  pageNumber,
  totalPages,
  previousPage,
  expiresAt,
  onNext,
  onPrevious,
  openGraphMetadata,
  contentId,
  sessionCoins = 0
}: DailyPublishedPageViewProps) {
  const isLastPage = pageNumber >= totalPages;
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(expiresAt));
  const navigate = useNavigate();
  
  // Word learning state
  const readingState = useReadingPageState();
  
  // Reset word learning state when page changes
  useEffect(() => {
    readingState.resetState();
  }, [page.id]);
  
  // Get current page words for word learning
  const { pages } = useBookPages(bookId);
  const currentPageWords = useMemo(() => {
    const currentPage = pages?.find(p => p.id === page.id);
    return currentPage?.content?.words || [];
  }, [pages, page.id]);
  
  // Determine if we should show text overlay (ABC books)
  const bookName = openGraphMetadata?.title || '';
  const bookDescription = openGraphMetadata?.description || '';
  const pageTextOverlay = page.content?.textOverlay?.enabled ? page.content.textOverlay.text : '';
  
  // Tap-to-advance handler
  const handleTapToAdvance = (e: React.MouseEvent) => {
    // Allow context menu to work on image
    if (e.button === 2) return;
    onNext();
  };

  // Simple expiration check - redirect to home if expired
  const isExpired = new Date() > new Date(expiresAt);
  useEffect(() => {
    if (isExpired) {
      console.log('Content has expired, redirecting to home...');
      // Note: Session end tracking is handled by the parent component's cleanup
      navigate('/', {
        replace: true
      });
      return;
    }
  }, [isExpired, navigate]);

  // Update countdown every 100ms for smooth real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = formatTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      // Check if content has expired during countdown
      if (new Date() > new Date(expiresAt)) {
        clearInterval(interval);
        navigate('/', {
          replace: true
        });
      }
    }, 100); // Update every 100ms for smoother countdown

    return () => clearInterval(interval);
  }, [expiresAt, navigate]);

  // Don't render anything if expired (navigation will happen)
  if (isExpired) {
    return null;
  }
  return <div className="h-screen bg-background flex flex-col overflow-hidden" style={{
    touchAction: 'none'
  }}>
      <FreemiumHeader
        timeRemaining={timeRemaining}
        previousPage={previousPage}
        onPrevious={onPrevious}
        bookId={bookId}
      />

      {/* Coin counter display */}
      {sessionCoins > 0 && (
        <div className="fixed top-14 right-4 z-40 animate-in fade-in slide-in-from-top-2 max-w-32">
          <RewardContainer earnedRewards={sessionCoins} />
        </div>
      )}

      {/* Focused page card - Fixed height to prevent scrolling */}
      <div className="h-[calc(100vh-12rem)] mt-4 px-4 flex items-center justify-center pb-24">
        <div className="max-w-md w-full cursor-pointer" onClick={handleTapToAdvance}>
          <ReadingPageDisplay
            pageId={page.id}
            bookId={bookId}
            pageNumber={pageNumber}
            pageText={(bookName?.toLowerCase().includes('abc') || 
              bookDescription?.toLowerCase().includes('abc')) ? pageTextOverlay : ''}
            imageUrl=""
            currentWordIndex={readingState.currentWordIndex}
            isWordEnlarged={readingState.isWordEnlarged}
            hiddenOverlayPages={readingState.hiddenOverlayPages}
            onToggleOverlayVisibility={readingState.toggleOverlayVisibility}
            imageComponent={
              <PublicPageImage pageId={page.id} bookId={bookId} />
            }
          />
        </div>
      </div>

      {/* Unified Reading Controls */}
      <UnifiedReadingControls
        hasWords={currentPageWords.length > 0}
        isEnlarged={readingState.isWordEnlarged}
        onMarkDifficult={() => readingState.handleMarkDifficult(currentPageWords.length)}
        onMarkUnderstood={() => readingState.handleMarkUnderstood(currentPageWords.length)}
        currentWordIndex={readingState.currentWordIndex}
        totalWords={currentPageWords.length}
        onNavigateWord={(dir) => readingState.handleNavigateWord(dir, currentPageWords.length)}
        onPreviousPage={onPrevious}
        onNextPage={onNext}
        disablePreviousPage={pageNumber <= 1}
        disableNextPage={isLastPage}
      />
    </div>;
}