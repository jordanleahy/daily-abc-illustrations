import { Card, CardContent } from '@/components/ui/card';
import { BottomSlideNavigation } from '@/components/ui/bottom-slide-navigation';
import { PublicPageImage } from './PublicPageImage';
import { FreemiumHeader } from './FreemiumHeader';
import { formatTimeRemaining } from '@/utils/timeUtils';
import type { Page } from '@/types/book';
import type { SEOMetadata } from '@/types/openGraph';
import { useState, useEffect } from 'react';
import { MetaHead } from '@/components/common';
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
  contentId
}: DailyPublishedPageViewProps) {
  const isLastPage = pageNumber >= totalPages;
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(expiresAt));
  const navigate = useNavigate();

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
        pageNumber={pageNumber}
        totalPages={totalPages}
      />

      {/* Focused page card - Fixed height to prevent scrolling */}
      <div className="h-[calc(100vh-8rem)] mt-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-0">
              {/* Large illustration area */}
              <div className="aspect-square bg-gradient-to-br from-background to-muted/50">
                <PublicPageImage pageId={page.id} bookId={bookId} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified bottom slide navigation */}
      <BottomSlideNavigation 
        onSlide={onNext}
        disabled={isLastPage}
        variant="compact"
        show={!isLastPage}
      />
    </div>;
}