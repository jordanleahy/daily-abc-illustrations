import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlideToUnlock } from '@/components/ui/slide-to-unlock';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PublicPageImage } from './PublicPageImage';
import { formatTimeRemaining } from '@/utils/timeUtils';
import type { Page } from '@/types/book';
import type { SEOMetadata } from '@/types/openGraph';
import { useState, useEffect } from 'react';
import { MetaHead } from '@/components/common';
import { useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';

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
      navigate('/', { replace: true });
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
        navigate('/', { replace: true });
      }
    }, 100); // Update every 100ms for smoother countdown

    return () => clearInterval(interval);
  }, [expiresAt, navigate]);

  // Don't render anything if expired (navigation will happen)
  if (isExpired) {
    return null;
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Fixed Header with countdown and page number */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-4 pb-2 bg-background/95 backdrop-blur-sm border-b">
        <div className="text-sm font-medium text-muted-foreground">
          {timeRemaining}
        </div>
        
        {/* Center section with QR button, previous page thumbnail and page indicator */}
        <div className="flex items-center gap-2">
          {/* QR Code Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8 rounded border border-border hover:bg-muted"
              >
                <QrCode className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Daily Published QR Code</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center text-muted-foreground">
                    <QrCode className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm">QR Code will be displayed here</p>
                    <p className="text-xs mt-1">Content ID: {contentId}</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Scan this code to access this daily published content
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
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
      <div className="fixed bottom-0 left-0 right-0 z-50 py-4 px-10 bg-background/95 backdrop-blur-sm border-t safe-area-inset-bottom">
        <SlideToUnlock 
          onUnlock={onNext}
          disabled={isLastPage}
          className="w-full"
        />
      </div>
    </div>
  );
}