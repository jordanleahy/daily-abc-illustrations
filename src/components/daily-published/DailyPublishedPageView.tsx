import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlideToUnlock } from '@/components/ui/slide-to-unlock';
import { PageImageSection } from '@/components/PageImageSection';
import type { Page } from '@/types/book';

interface DailyPublishedPageViewProps {
  page: Page;
  bookId: string;
  pageNumber: number;
  totalPages: number;
  previousPage?: Page;
  onNext: () => void;
  onPrevious?: () => void;
}

export function DailyPublishedPageView({ 
  page, 
  bookId, 
  pageNumber, 
  totalPages,
  previousPage,
  onNext, 
  onPrevious
}: DailyPublishedPageViewProps) {
  const isLastPage = pageNumber >= totalPages;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Fixed Header with branding and page number */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-4 pb-2 bg-background/95 backdrop-blur-sm border-b">
        <div className="text-sm font-medium text-muted-foreground">
          Daily ABC Illustrations
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
                <PageImageSection 
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
                <PageImageSection 
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
        <SlideToUnlock 
          onUnlock={onNext}
          disabled={isLastPage}
          className="w-full"
        />
      </div>
    </div>
  );
}