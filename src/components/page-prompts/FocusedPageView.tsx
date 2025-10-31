import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BottomSlideNavigation } from '@/components/ui/bottom-slide-navigation';
import { PageImageSection } from '@/components/PageImageSection';
import { ArrowLeft } from 'lucide-react';
import type { Page } from '@/types/book';

interface FocusedPageViewProps {
  page: Page;
  bookId: string;
  pageNumber: number;
  totalPages: number;
  previousPage?: Page;
  preloadedImageUrl?: string;
  previousPageImageUrl?: string;
  onNext: () => void;
  onPrevious?: () => void;
  onExit: () => void;
}

export function FocusedPageView({ 
  page, 
  bookId, 
  pageNumber, 
  totalPages,
  previousPage,
  preloadedImageUrl,
  previousPageImageUrl,
  onNext, 
  onPrevious,
  onExit 
}: FocusedPageViewProps) {
  const isLastPage = pageNumber >= totalPages;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Fixed Header with exit button and page number */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-4 pb-2 bg-background/95 backdrop-blur-sm border-b">
        <Button variant="ghost" size="sm" onClick={onExit} className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100">
          <ArrowLeft className="w-3 h-3" />
          <span className="sr-only">Exit</span>
        </Button>
        
        {/* Previous page thumbnail for navigation */}
        {previousPage && onPrevious && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            className="p-1 h-8 w-8 rounded border border-border hover:bg-muted"
          >
            <div className="w-6 h-6 bg-muted rounded-sm overflow-hidden">
              <PageImageSection 
                pageId={previousPage.id}
                bookId={bookId}
                preloadedImageUrl={previousPageImageUrl}
              />
            </div>
          </Button>
        )}
      </div>

      {/* Focused page card - Fixed height to prevent scrolling */}
      <div className="h-[calc(100vh-8rem)] mt-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="overflow-hidden shadow-lg">
            <CardContent className="p-0">
              {/* Large illustration area */}
              <div className="aspect-square bg-gradient-to-br from-background to-muted/50">
                <PageImageSection 
                  pageId={page.id}
                  bookId={bookId}
                  preloadedImageUrl={preloadedImageUrl}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified bottom slide navigation */}
      <BottomSlideNavigation 
        onSlide={onNext}
        disabled={isLastPage}
        variant="wide"
      />
    </div>
  );
}