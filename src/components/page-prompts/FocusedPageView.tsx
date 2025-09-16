import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageImageSection } from '@/components/PageImageSection';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-background p-4 flex flex-col">
      {/* Header with exit button and page number */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={onExit} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Exit
        </Button>
        <div className="text-sm text-muted-foreground font-medium">
          Page {pageNumber} of {totalPages}
        </div>
      </div>

      {/* Focused page card */}
      <div className="flex-1 max-w-md mx-auto w-full">
        <Card className="h-full overflow-hidden shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-foreground text-center">
              {page.title}
            </CardTitle>
            {page.description && (
              <p className="text-base text-muted-foreground leading-relaxed text-center">
                {page.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="p-0 flex-1">
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

      {/* Slide button at bottom */}
      <div className="mt-6">
        <Button 
          size="lg" 
          className="w-full h-16 text-lg font-semibold"
          onClick={onNext}
          disabled={isLastPage}
        >
          {isLastPage ? 'The End!' : (
            <>
              Slide
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}