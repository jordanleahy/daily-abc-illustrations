/**
 * LibraryBookView - Library Books
 * 
 * ⚠️ Uses UnifiedReadingView (shared component)
 * Changes to UnifiedReadingView will affect this view
 * 
 * Displays books from the library at /library/:id route
 * Configuration:
 * - contentType: 'library_book'
 * - showUploadButton: false (read-only)
 * - showSwipeDrawer: false
 * - Uses PublicPageImage component
 */

import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedOpenGraph } from '@/hooks/useDailyPublishedOpenGraph';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { useDailyPublishedImagePreloader } from '@/hooks/useDailyPublishedImagePreloader';
import { useAuthContext } from '@/contexts/AuthContext';
import { trackBookView } from '@/utils/bookViewTracking';
import { Card } from '@/components/ui/card';
import { PublicPageImage } from '@/components/daily-published';
import { UnifiedReadingView } from '@/components/reading';
import { RoleDebugger } from '@/components/RoleDebugger';
import { Calendar } from 'lucide-react';
import { isValidUUID } from '@/utils/uuid';
import { useEffect, useMemo } from 'react';

export default function LibraryBookView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const safeId = id && isValidUUID(id) ? id : undefined;
  
  const { data: dailyContent, isLoading: isLoadingDaily, error: dailyError } = useLibraryBookById(safeId);
  const { data: pages = [], isLoading: isLoadingPages } = useDailyPublishedPages(dailyContent?.book_id);
  const { openGraphMetadata } = useDailyPublishedOpenGraph(safeId, 0);
  
  // Track book view when page loads
  useEffect(() => {
    if (dailyContent?.id && user) {
      trackBookView(dailyContent.id);
    }
  }, [dailyContent?.id, user]);
  
  // Get starting page index from location state
  const startingPageIndex = location.state?.startingPageIndex ?? 0;
  
  // Prefetch all page images in the background for instant navigation
  useDailyPublishedImagePreloader(pages, dailyContent?.book_id);
  
  const isLoading = isLoadingDaily || isLoadingPages;

  const handleBack = () => {
    navigate('/library');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (dailyError || !dailyContent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Book Not Found</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              This book could not be found in your library.
            </p>
            {dailyError && (
              <p className="text-sm text-destructive">
                Error: {dailyError.message}
              </p>
            )}
          </div>
        </Card>
        <RoleDebugger />
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold">{dailyContent.title}</h2>
            <p className="text-sm text-muted-foreground">
              This publication doesn't have any pages to display.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const entryPoint = location.state?.from === 'user-library-detail' ? 'reading_view_button' : 'library_card';

  return (
    <UnifiedReadingView
      contentType="library_book"
      book={{
        id: dailyContent.id,
        book_id: dailyContent.book_id,
        title: dailyContent.title,
      }}
      pages={pages}
      startingPageIndex={startingPageIndex}
      onBack={handleBack}
      showUploadButton={false}
      entryPoint={entryPoint}
      openGraphMetadata={openGraphMetadata}
      imageComponent={(page) => (
        <PublicPageImage 
          pageId={page.id}
          bookId={dailyContent.book_id}
          className="rounded-lg"
          showUploadButton={false}
          isFirstImage={page.id === pages[startingPageIndex]?.id}
        />
      )}
    />
  );
}
