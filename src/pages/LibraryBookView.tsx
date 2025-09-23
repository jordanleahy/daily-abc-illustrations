import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedOpenGraph } from '@/hooks/useDailyPublishedOpenGraph';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { MetaHead } from '@/components/common';
import { SmartHeader } from '@/components/layout';
import { PublicPageImage } from '@/components/daily-published';
import { Card } from '@/components/ui/card';
import { SlideToUnlock } from '@/components/ui/slide-to-unlock';
import { SwipeUpDrawer } from '@/components/ui/swipe-up-drawer';
import { UpcomingBooksPreview } from '@/components/daily-published';
import { Calendar, Clock } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export default function LibraryBookView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dailyContent, isLoading: isLoadingDaily, error: dailyError } = useLibraryBookById(id);
  
  const { data: pages = [], isLoading: isLoadingPages } = useDailyPublishedPages(dailyContent?.book_id);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Generate OpenGraph metadata for the current page
  const { openGraphMetadata } = useDailyPublishedOpenGraph(id, currentPageIndex);

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <SmartHeader title="Library" onBack={handleBack} showQRCode={false} />
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Book Not Found</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              This book could not be found in your library.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <SmartHeader title="Library" onBack={handleBack} showQRCode={false} />
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

  const currentPage = pages[currentPageIndex];
  const isLastPage = currentPageIndex >= pages.length - 1;

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
    <div className="min-h-screen bg-background">
      {/* Dynamic meta tags for social sharing */}
      {openGraphMetadata && <MetaHead metadata={openGraphMetadata} />}
      
      <div className="flex flex-col h-screen" style={{ touchAction: 'none' }}>
        <SmartHeader 
          title={dailyContent.title}
          subtitle={`${currentPageIndex + 1} of ${pages.length}`}
          bookId={dailyContent.book_id}
          onBack={handleBack}
        />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col pt-16 pb-4">
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm mx-auto shadow-lg">
              <PublicPageImage 
                pageId={currentPage.id}
                bookId={dailyContent.book_id}
                className="rounded-lg"
              />
            </Card>
          </div>
          
          {/* Navigation */}
          {!isLastPage && (
            <div className="px-24 pb-4">
              <SlideToUnlock onUnlock={handleNext} />
            </div>
          )}
          
          {isLastPage && (
            <SwipeUpDrawer>
              <UpcomingBooksPreview />
            </SwipeUpDrawer>
          )}
        </div>
      </div>
    </div>
  );
}