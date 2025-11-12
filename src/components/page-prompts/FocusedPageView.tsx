import { Button } from '@/components/ui/button';
import { BottomSlideNavigation } from '@/components/ui/bottom-slide-navigation';
import { PageImageSection } from '@/components/PageImageSection';
import { ReadingPageDisplay } from '@/components/reading/ReadingPageDisplay';
import { useReadingPreferences } from '@/hooks/useReadingPreferences';
import { useRealTimeInlineEdit } from '@/hooks/useRealTimeInlineEdit';
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
  const { hiddenOverlayPages, toggleOverlay, isLoading: isPreferencesLoading } = useReadingPreferences();
  
  const { updateValue: updatePageTitle } = useRealTimeInlineEdit({
    tableName: 'pages',
    recordId: page.id,
    initialValue: page.title || '',
    fieldName: 'title',
  });

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
          <ReadingPageDisplay
            pageId={page.id}
            bookId={bookId}
            pageNumber={pageNumber}
            pageText={page.title || ''}
            imageUrl={preloadedImageUrl || ''}
            mode="edit"
            onUpdatePageText={updatePageTitle}
            hiddenOverlayPages={hiddenOverlayPages}
            onToggleOverlayVisibility={toggleOverlay}
            isPreferencesLoading={isPreferencesLoading}
            showDismissButton={true}
            className="shadow-lg"
          />
        </div>
      </div>

      {/* Unified arrow navigation */}
      <BottomSlideNavigation 
        onPrevious={onPrevious}
        onNext={onNext}
        disablePrevious={pageNumber <= 1}
        disableNext={isLastPage}
        variant="wide"
      />
    </div>
  );
}