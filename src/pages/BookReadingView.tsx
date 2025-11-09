import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { reorderPagesFromStartingLetter } from '@/utils/pageNavigation';
import { useBook } from '@/hooks/useBook';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { useReadingSessionAnalytics } from '@/hooks/useReadingSessionAnalytics';
import { useAuthContext } from '@/contexts/AuthContext';
import { trackBookView } from '@/utils/bookViewTracking';
import { toast } from 'sonner';
import { MetaHead } from '@/components/common';
import { ReadingHeader } from '@/components/layout/ReadingHeader';
import { TextOverlay } from '@/components/ui/text-overlay';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { isValidUUID } from '@/utils/uuid';

/**
 * BookReadingView - Reading interface for user-created books
 * Similar to LibraryBookView but works with books table instead of daily_published
 */
export default function BookReadingView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const safeId = id && isValidUUID(id) ? id : undefined;
  
  const { data: book, isLoading: isLoadingBook, error: bookError } = useBook(safeId);
  const { pages = [], loading: isLoadingPages } = useBookPages(safeId);
  const { data: pageImages = {}, isLoading: isLoadingImages } = useBookPageImages(safeId);
  const { startSession, trackPageView, endSession } = useReadingSessionAnalytics();
  
  // Track book view when page loads
  useEffect(() => {
    if (book?.id && user) {
      trackBookView(book.id);
    }
  }, [book?.id, user]);
  
  // Get starting page index from location state
  const startingPageIndex = location.state?.startingPageIndex ?? 0;
  
  // Reorder pages to create circular reading experience starting from chosen page
  const reorderedPages = useMemo(() => {
    if (!pages.length || startingPageIndex === 0) return pages;
    return reorderPagesFromStartingLetter(pages, startingPageIndex);
  }, [pages, startingPageIndex]);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [initialPageTracked, setInitialPageTracked] = useState(false);
  
  const isLastPage = currentPageIndex === reorderedPages.length - 1;
  const isLoading = isLoadingBook || isLoadingPages;

  // Start analytics session when content loads
  useEffect(() => {
    if (book && reorderedPages.length > 0 && !sessionStarted) {
      const entryPoint = location.state?.from === 'library' ? 'library_card' : 'direct_link';
      
      startSession({
        contentType: 'library_book',
        contentId: book.id,
        bookId: book.id,
        totalPages: reorderedPages.length,
        entryPoint,
        startingPage: startingPageIndex + 1,
      });
      
      setSessionStarted(true);
    }
  }, [book, reorderedPages.length, sessionStarted, startSession, startingPageIndex]);

  // Track initial page view
  useEffect(() => {
    if (reorderedPages.length > 0 && !initialPageTracked && sessionStarted) {
      const currentPage = reorderedPages[currentPageIndex];
      if (currentPage) {
        trackPageView(currentPage.page_number, currentPage.letter);
        setInitialPageTracked(true);
      }
    }
  }, [reorderedPages, currentPageIndex, initialPageTracked, trackPageView, sessionStarted]);

  // Cleanup: end session on unmount
  useEffect(() => {
    return () => {
      if (sessionStarted) {
        endSession(String(currentPageIndex + 1));
      }
    };
  }, [sessionStarted, currentPageIndex, endSession]);

  // Handle page navigation
  const handleNextPage = () => {
    if (currentPageIndex < reorderedPages.length - 1) {
      const newIndex = currentPageIndex + 1;
      setCurrentPageIndex(newIndex);
      const nextPage = reorderedPages[newIndex];
      if (nextPage) {
        trackPageView(nextPage.page_number, nextPage.letter, 'button_click');
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      const newIndex = currentPageIndex - 1;
      setCurrentPageIndex(newIndex);
      const prevPage = reorderedPages[newIndex];
      if (prevPage) {
        trackPageView(prevPage.page_number, prevPage.letter, 'button_click');
      }
    }
  };

  const handleBackToLibrary = () => {
    if (sessionStarted) {
      endSession(String(currentPageIndex + 1));
    }
    navigate('/library');
  };

  // Handle errors
  if (bookError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="text-center space-y-4">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">Book Not Found</h2>
            <p className="text-muted-foreground">
              This book could not be found in your library.
            </p>
            <button
              onClick={() => navigate('/library')}
              className="text-primary hover:underline"
            >
              Return to Library
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!book || reorderedPages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="text-center space-y-4">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">No Pages Available</h2>
            <p className="text-muted-foreground">
              This book doesn't have any pages yet.
            </p>
            <button
              onClick={() => navigate('/library')}
              className="text-primary hover:underline"
            >
              Return to Library
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const currentPage = reorderedPages[currentPageIndex];
  const currentImageUrl = currentPage ? pageImages[currentPage.id]?.imageUrl : undefined;
  const showTextOverlay = currentPage?.content?.textOverlay?.enabled && currentPage?.content?.textOverlay?.text;

  return (
    <>
      <MetaHead metadata={{
        title: `${book.book_name} - Reading`,
        description: book.book_description || `Read ${book.book_name}`,
        type: 'article'
      }} />

      <div className="min-h-screen bg-background">
        <ReadingHeader
          title={book.book_name}
          onBack={handleBackToLibrary}
        />

        <main className="container max-w-4xl mx-auto px-4 pt-20 pb-32">
          <div className="space-y-6">
            {/* Page Progress */}
            <div className="text-center text-sm text-muted-foreground">
              Page {currentPageIndex + 1} of {reorderedPages.length}
            </div>

            {/* Main Image Card */}
            <Card className="relative overflow-hidden">
              <div className="relative aspect-square w-full">
                {currentImageUrl ? (
                  <>
                    <img
                      src={currentImageUrl}
                      alt={currentPage?.content?.mainConcept || `Page ${currentPage?.page_number}`}
                      className="w-full h-full object-contain bg-muted"
                      loading="eager"
                    />
                    {showTextOverlay && currentPage?.content?.textOverlay && (
                      <TextOverlay 
                        text={currentPage.content.textOverlay.text} 
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </Card>

            {/* Page Content */}
            {currentPage && (
              <Card className="p-6 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    {currentPage.content?.mainConcept || currentPage.title}
                  </h2>
                  {currentPage.content?.funFact && (
                    <p className="text-lg text-muted-foreground">
                      {currentPage.content.funFact}
                    </p>
                  )}
                </div>

                {currentPage.content?.activity && (
                  <div className="mt-4 p-4 bg-accent/10 rounded-lg">
                    <h3 className="font-semibold mb-2">Activity</h3>
                    <p className="text-muted-foreground">{currentPage.content.activity}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center gap-4">
              <Button
                onClick={handlePrevPage}
                disabled={currentPageIndex === 0}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={handleNextPage}
                disabled={isLastPage}
                variant="default"
                size="lg"
                className="flex-1"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
