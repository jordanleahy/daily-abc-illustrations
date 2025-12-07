/**
 * DailyPublishedPageView - Daily Content (Homepage)
 * 
 * ⚠️ Uses UnifiedReadingView (shared component)
 * Changes to UnifiedReadingView will affect this view
 * 
 * Displays daily published content on homepage
 * Configuration:
 * - contentType: 'daily_published'
 * - showUploadButton: false (read-only)
 * - showSwipeDrawer: false
 * - Uses PublicPageImage component
 * - Custom features:
 *   - FreemiumHeader with countdown timer
 *   - Content expiration handling
 *   - Tap-to-advance enabled
 *   - Custom navigation handlers (onNext, onPrevious)
 */

import { UnifiedReadingView } from '@/components/reading';
import { FreemiumHeader } from './FreemiumHeader';
import { formatTimeRemaining } from '@/utils/timeUtils';
import { PublicPageImage } from './PublicPageImage';
import type { Page } from '@/types/book';
import type { SEOMetadata } from '@/types/openGraph';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(expiresAt));
  const navigate = useNavigate();
  
  // Determine if we should show text overlay (ABC books)
  const bookName = openGraphMetadata?.title || '';
  const bookDescription = openGraphMetadata?.description || '';
  
  // Update countdown every 100ms for smooth real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = formatTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      if (new Date() > new Date(expiresAt)) {
        clearInterval(interval);
        navigate('/', { replace: true });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [expiresAt, navigate]);

  // Create custom header with timer
  const customHeader = (
    <FreemiumHeader
      timeRemaining={timeRemaining}
      previousPage={previousPage}
      onPrevious={onPrevious}
      bookId={bookId}
    />
  );

  return (
    <UnifiedReadingView
      contentType="daily_published"
      book={{
        id: contentId || bookId,
        book_id: bookId,
        title: bookName,
        book_description: bookDescription,
      }}
      pages={[page]}
      startingPageIndex={0}
      onBack={() => navigate('/')}
      onNext={onNext}
      onPrevious={onPrevious}
      showUploadButton={false}
      showSwipeDrawer={false}
      customHeader={customHeader}
      entryPoint="homepage_redirect"
      openGraphMetadata={openGraphMetadata}
      sessionCoins={sessionCoins}
      expiresAt={expiresAt}
      onTapToAdvance={true}
      contentId={contentId}
      imageComponent={(currentPage, pageIndex, currentWordData) => (
        <PublicPageImage 
          pageId={currentPage.id} 
          bookId={bookId}
          isFirstImage={pageNumber === 1}
          disableHoverEffects={true}
          enableVisibilityToggle={true}
          currentWordData={currentWordData}
        />
      )}
    />
  );
}
