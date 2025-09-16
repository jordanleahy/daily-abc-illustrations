import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlideToUnlock } from '@/components/ui/slide-to-unlock';
import { PageImageSection } from '@/components/PageImageSection';
import { ArrowLeft } from 'lucide-react';
import type { Page } from '@/types/book';

interface FocusedPageViewProps {
  page: Page;
  bookId: string;
  pageNumber: number;
  totalPages: number;
  onNext: () => void;
  onExit: () => void;
}

export function FocusedPageView({ 
  page, 
  bookId, 
  pageNumber, 
  totalPages, 
  onNext, 
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
        <div className="text-xs text-muted-foreground font-medium">
          Page {pageNumber} of {totalPages}
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