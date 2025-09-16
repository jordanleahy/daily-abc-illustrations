import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useDailyPublishedById } from '@/hooks/useDailyPublishedById';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { useDailyPublishedPagesPublic } from '@/hooks/useDailyPublishedPagesPublic';
import { useAuth } from '@/hooks/useAuth';
import { DailyPublishedPageView } from '@/components/daily-published';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Instagram } from 'lucide-react';

export default function DailyPublished() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const isInstagramShare = location.pathname.includes('/instagram-shared/');
  const { data: dailyContent, isLoading: isLoadingDaily, error: dailyError } = useDailyPublishedById(id);
  // Always use the public function that validates active daily publication
  const { data: pages = [], isLoading: isLoadingPages } = useDailyPublishedPagesPublic(
    dailyContent?.book_id
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const isLoading = isLoadingDaily || isLoadingPages;
  const currentPages = pages;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading daily content...</p>
        </div>
      </div>
    );
  }

  if (dailyError || !dailyContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {isInstagramShare ? (
                <>
                  <Instagram className="h-5 w-5" />
                  Instagram Subscribers
                </>
              ) : (
                <>
                  <Calendar className="h-5 w-5" />
                  Daily ABC Illustrations
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isInstagramShare 
                ? "This Instagram subscriber content is not available"
                : "No daily content is currently available"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {isInstagramShare 
                ? "This link may be invalid or the content may have been removed."
                : "Check back tomorrow for new illustrated content, or the current daily publication may have expired."
              }
            </p>
            {!isInstagramShare && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                Daily content expires after 48 hours
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentPages || currentPages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>{dailyContent.title}</CardTitle>
            <CardDescription>No pages available</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              This daily publication doesn't have any pages to display.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPage = currentPages[currentPageIndex];
  const previousPage = currentPageIndex > 0 ? currentPages[currentPageIndex - 1] : undefined;
  const isLastPage = currentPageIndex >= currentPages.length - 1;

  const handleNext = () => {
    if (!isLastPage) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  return (
    <DailyPublishedPageView
      page={currentPage}
      bookId={dailyContent.book_id}
      pageNumber={currentPageIndex + 1}
      totalPages={currentPages.length}
      previousPage={previousPage}
      onNext={handleNext}
      onPrevious={currentPageIndex > 0 ? handlePrevious : undefined}
    />
  );
}