import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDailyPublishedById } from '@/hooks/useDailyPublishedById';
import { useDailyPublishedOpenGraph } from '@/hooks/useDailyPublishedOpenGraph';
import { DailyPublishedPageView, useDailyPublishedPages } from '@/components/daily-published';
import { useReadingSessionAnalytics } from '@/hooks/useReadingSessionAnalytics';
import { useDailyPublishedImagePreloader } from '@/hooks/useDailyPublishedImagePreloader';
import { MetaHead } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';
import { reorderPagesFromStartingLetter } from '@/utils/pageNavigation';
import { useAuthContext } from '@/contexts/AuthContext';

export default function DailyPublished() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  const { data: result, isLoading: isLoadingDaily, error: dailyError } = useDailyPublishedById(id);
  const dailyContent = result?.data;
  const isExpired = result?.isExpired;
  
  const { data: pages = [], isLoading: isLoadingPages } = useDailyPublishedPages(dailyContent?.book_id);
  
  // Prefetch and preload all page images
  useDailyPublishedImagePreloader(pages, dailyContent?.book_id);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [reorderedPages, setReorderedPages] = useState<typeof pages>([]);
  const [originalStartingIndex, setOriginalStartingIndex] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  const { startSession, trackPageView, endSession } = useReadingSessionAnalytics();

  // Set random starting page and create reordered circular array
  useEffect(() => {
    if (pages.length > 0 && !sessionStarted) {
      const randomIndex = Math.floor(Math.random() * pages.length);
      const circularPages = reorderPagesFromStartingLetter(pages, randomIndex);
      
      setReorderedPages(circularPages);
      setOriginalStartingIndex(randomIndex);
      setCurrentPageIndex(0); // Start at index 0 in the reordered array
      
      console.log('[DailyPublished] pages loaded:', pages.length, 'startIndex:', randomIndex);
      
      // Start analytics session
      if (dailyContent) {
        const entryPoint = location.state?.from === 'homepage' ? 'homepage_redirect' : 'direct_link';
        
        startSession({
          contentType: 'daily_published',
          contentId: dailyContent.id,
          bookId: dailyContent.book_id,
          bookName: dailyContent.title,
          category: 'Daily Published',
          totalPages: pages.length,
          entryPoint,
          startingPage: randomIndex + 1, // Use original index for analytics
        });
        
        // Track initial page view with the starting letter
        const startingPage = circularPages[0];
        if (startingPage) {
          trackPageView(1, startingPage.letter, 'session_start');
        }
        
        setSessionStarted(true);
      }
    }
  }, [pages.length, dailyContent, sessionStarted, startSession, trackPageView, location.state]);
  
  // Generate OpenGraph metadata for the current page
  const { openGraphMetadata } = useDailyPublishedOpenGraph(id, currentPageIndex);
  
  // Keyboard navigation for desktop users (works with reordered circular array)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        // Handle next page - stop at the end of reordered array (letter before starting letter)
        if (currentPageIndex < reorderedPages.length - 1) {
          const newIndex = currentPageIndex + 1;
          setCurrentPageIndex(newIndex);
          
          // Track page view
          if (sessionStarted && reorderedPages[newIndex]) {
            trackPageView(newIndex + 1, reorderedPages[newIndex].letter, 'keyboard_next');
          }
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        // Handle previous page with wrap-around
        const newIndex = currentPageIndex > 0 ? currentPageIndex - 1 : reorderedPages.length - 1;
        setCurrentPageIndex(newIndex);
        
        // Track page view
        if (sessionStarted && reorderedPages[newIndex]) {
          const interactionType = currentPageIndex === 0 ? 'keyboard_wrap' : 'keyboard_previous';
          trackPageView(newIndex + 1, reorderedPages[newIndex].letter, interactionType);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, reorderedPages, sessionStarted, trackPageView]);

  const isLoading = isLoadingDaily || isLoadingPages;

  // Redirect to homepage if content is expired
  useEffect(() => {
    if (!isLoadingDaily && isExpired) {
      navigate('/', { replace: true });
    }
  }, [isLoadingDaily, isExpired, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header skeleton */}
        <div className="w-full bg-muted/30 p-4 border-b border-border">
          <div className="h-8 w-48 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md animate-pulse" />
        </div>
        
        {/* Image skeleton - matches final layout */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl aspect-square bg-gradient-to-br from-muted via-muted/50 to-muted rounded-lg animate-pulse" />
        </div>
        
        {/* Bottom controls skeleton */}
        <div className="w-full bg-muted/30 p-4 border-t border-border">
          <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
            <div className="h-10 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md animate-pulse" />
            <div className="h-6 w-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md animate-pulse" />
            <div className="h-10 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md animate-pulse" />
          </div>
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

  if (!reorderedPages || reorderedPages.length === 0) {
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

  const currentPage = reorderedPages[currentPageIndex];
  const previousPage = currentPageIndex > 0 ? reorderedPages[currentPageIndex - 1] : undefined;
  const isLastPage = currentPageIndex >= reorderedPages.length - 1;

  const handleNext = () => {
    // Award a coin for completing this page
    setSessionCoins(prev => prev + 1);
    
    if (isLastPage) {
      console.log('[DailyPublished] reached last page, navigating to /schedule');
      // On last page, navigate to schedule
      navigate('/schedule');
    } else {
      const newIndex = currentPageIndex + 1;
      console.log('[DailyPublished] next page', { newIndex, total: reorderedPages.length });
      setCurrentPageIndex(newIndex);
      
      // Track page view
      if (sessionStarted && reorderedPages[newIndex]) {
        trackPageView(newIndex + 1, reorderedPages[newIndex].letter, 'next_swipe');
      }
    }
  };

  const handlePrevious = () => {
    // Wrap around to last page if at the beginning
    const newIndex = currentPageIndex > 0 ? currentPageIndex - 1 : reorderedPages.length - 1;
    setCurrentPageIndex(newIndex);
    
    // Track page view
    if (sessionStarted && reorderedPages[newIndex]) {
      const interactionType = currentPageIndex === 0 ? 'previous_wrap' : 'previous_swipe';
      trackPageView(newIndex + 1, reorderedPages[newIndex].letter, interactionType);
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
        totalPages={pages.length} // Use original pages length for consistency
        previousPage={previousPage}
        expiresAt={dailyContent.expires_at}
        onNext={handleNext}
        onPrevious={handlePrevious}
        openGraphMetadata={openGraphMetadata}
        contentId={dailyContent.id}
        sessionCoins={sessionCoins}
      />
    </div>
  );
}