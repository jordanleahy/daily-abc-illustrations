import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDailyPublishedById } from '@/hooks/useDailyPublishedById';
import { useDailyPublishedOpenGraph } from '@/hooks/useDailyPublishedOpenGraph';
import { DailyPublishedPageView, useDailyPublishedPages } from '@/components/daily-published';
import { useReadingSessionAnalytics } from '@/hooks/useReadingSessionAnalytics';
import { MetaHead } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';
import { reorderPagesFromStartingLetter, getStartingLetterIndex } from '@/utils/pageOrdering';

export default function DailyPublished() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: result, isLoading: isLoadingDaily, error: dailyError } = useDailyPublishedById(id);
  const dailyContent = result?.data;
  const isExpired = result?.isExpired;
  
  const { data: originalPages = [], isLoading: isLoadingPages } = useDailyPublishedPages(dailyContent?.book_id);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const { startSession, trackPageView, endSession } = useReadingSessionAnalytics();

  // Reorder pages to start from deterministic letter based on publication date
  const pages = dailyContent && originalPages.length > 0 
    ? reorderPagesFromStartingLetter(originalPages, getStartingLetterIndex(dailyContent.published_at))
    : originalPages;

  // Initialize session once pages are loaded and reordered
  useEffect(() => {
    if (pages.length > 0 && !sessionStarted && dailyContent) {
      // Start from page 0 (first reordered page)
      setCurrentPageIndex(0);
      
      // Start analytics session
      const entryPoint = location.state?.from === 'homepage' ? 'homepage_redirect' : 'direct_link';
      
      startSession({
        contentType: 'daily_published',
        contentId: dailyContent.id,
        bookId: dailyContent.book_id,
        totalPages: pages.length,
        entryPoint,
        startingPage: 1, // Always start at page 1 in the reordered sequence
      });
      
      // Track initial page view
      const startingPage = pages[0];
      if (startingPage) {
        trackPageView(1, startingPage.letter, 'session_start');
      }
      
      setSessionStarted(true);
    }
  }, [pages.length, dailyContent, sessionStarted, startSession, trackPageView, location.state]);
  
  // Generate OpenGraph metadata for the current page
  const { openGraphMetadata } = useDailyPublishedOpenGraph(id, currentPageIndex);
  
  // Debug logging for troubleshooting
  console.log('🏠 [DEBUG] DailyPublished page rendering with:', {
    id,
    currentPageIndex,
    hasOpenGraphMetadata: !!openGraphMetadata,
    openGraphTitle: openGraphMetadata?.title,
    openGraphDescription: openGraphMetadata?.description
  });

  const isLoading = isLoadingDaily || isLoadingPages;

  // Redirect to homepage if content is expired
  useEffect(() => {
    if (!isLoadingDaily && isExpired) {
      navigate('/', { replace: true });
    }
  }, [isLoadingDaily, isExpired, navigate]);

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
              <Calendar className="h-5 w-5" />
              {SITE_CONFIG.dailyContent.title}
            </CardTitle>
            <CardDescription>
              No daily content is currently available
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Check back tomorrow for new illustrated content, or the current daily publication may have expired.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              New content published {SITE_CONFIG.dailyContent.schedule}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pages || pages.length === 0) {
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

  const currentPage = pages[currentPageIndex];
  const previousPage = currentPageIndex > 0 ? pages[currentPageIndex - 1] : undefined;
  const isLastPage = currentPageIndex >= pages.length - 1;

  const handleNext = () => {
    if (!isLastPage) {
      const newIndex = currentPageIndex + 1;
      setCurrentPageIndex(newIndex);
      
      // Track page view
      if (sessionStarted && pages[newIndex]) {
        trackPageView(newIndex + 1, pages[newIndex].letter, 'next_swipe');
      }
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      const newIndex = currentPageIndex - 1;
      setCurrentPageIndex(newIndex);
      
      // Track page view
      if (sessionStarted && pages[newIndex]) {
        trackPageView(newIndex + 1, pages[newIndex].letter, 'previous_swipe');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic meta tags for social sharing */}
      {openGraphMetadata && <MetaHead metadata={openGraphMetadata} />}
      
      <DailyPublishedPageView
        page={currentPage}
        bookId={dailyContent.book_id}
        pageNumber={currentPageIndex + 1}
        totalPages={pages.length}
        previousPage={previousPage}
        expiresAt={dailyContent.expires_at}
        onNext={handleNext}
        onPrevious={currentPageIndex > 0 ? handlePrevious : undefined}
        openGraphMetadata={openGraphMetadata}
        contentId={dailyContent.id}
      />
    </div>
  );
}