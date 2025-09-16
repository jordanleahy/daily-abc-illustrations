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
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Header with exit button and page number */}
      <div className="flex justify-between items-center p-4 pb-2">
        <Button variant="ghost" onClick={onExit} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Exit
        </Button>
        <div className="text-sm text-muted-foreground font-medium">
          Page {pageNumber} of {totalPages}
        </div>
      </div>

      {/* Focused page card */}
      <div className="flex-1 px-4 pb-24 flex items-center justify-center">
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