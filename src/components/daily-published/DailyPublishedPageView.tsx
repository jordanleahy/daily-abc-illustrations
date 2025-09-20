import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlideToUnlock } from '@/components/ui/slide-to-unlock';
import { PublicPageImage } from './PublicPageImage';
import { formatTimeRemaining } from '@/utils/timeUtils';
import { useExpirationTransition } from '@/hooks/useExpirationTransition';
import type { Page } from '@/types/book';
import type { SEOMetadata } from '@/types/openGraph';
import { useState, useEffect } from 'react';
import { MetaHead } from '@/components/common';
import { Loader2 } from 'lucide-react';

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
  
  // Handle smooth transitions when content is about to expire
  const { isNearExpiry, isTransitioning } = useExpirationTransition({
    currentId: contentId,
    expiresAt
  });

  // Update countdown every 100ms for smooth real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(expiresAt));
    }, 100); // Update every 100ms for smoother countdown

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Show transition overlay when content is transitioning
  if (isTransitioning) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto p-6">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Loading New Content</h3>
            <p className="text-sm text-muted-foreground">
              Fresh daily content is being prepared for you...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Fixed Header with countdown and page number */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-4 pb-2 bg-background/95 backdrop-blur-sm border-b">
        <div className={`text-sm font-medium transition-colors duration-300 ${
          isNearExpiry ? 'text-destructive animate-pulse' : 'text-muted-foreground'
        }`}>
          {isNearExpiry && '⚡ '}{timeRemaining}
        </div>
        
        {/* Center section with previous page thumbnail and page indicator */}
        <div className="flex items-center gap-2">
          {previousPage && onPrevious && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              className="p-1 h-8 w-8 rounded border border-border hover:bg-muted"
            >
              <div className="w-6 h-6 bg-muted rounded-sm overflow-hidden">
                <PublicPageImage 
                  pageId={previousPage.id}
                  bookId={bookId}
                />
              </div>
            </Button>
          )}
          <div className="text-xs text-muted-foreground font-medium">
            Page {pageNumber} of {totalPages}
          </div>
        </div>
      </div>

      {/* Focused page card - Fixed height to prevent scrolling */}
      <div className="h-[calc(100vh-8rem)] mt-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-0">
              {/* Large illustration area */}
              <div className="aspect-square bg-gradient-to-br from-background to-muted/50">
                <PublicPageImage 
                  pageId={page.id}
                  bookId={bookId}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Slide to unlock at bottom - sticky with proper mobile support */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t safe-area-inset-bottom">
        {isNearExpiry && (
          <div className="mb-2 text-center">
            <p className="text-xs text-muted-foreground">
              New content loading soon...
            </p>
          </div>
        )}
        <SlideToUnlock 
          onUnlock={onNext}
          disabled={isLastPage}
          className="w-full"
        />
      </div>
    </div>
  );
}