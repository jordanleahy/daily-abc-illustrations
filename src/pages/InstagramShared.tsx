import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useInstagramSharedById } from '@/hooks/useInstagramSharedById';
import { useInstagramSharedPagesPublic } from '@/hooks/useInstagramSharedPagesPublic';
import { useAuth } from '@/hooks/useAuth';
import { DailyPublishedPageView } from '@/components/daily-published';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Instagram } from 'lucide-react';

export default function InstagramShared() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  
  const { data: instagramContent, error: contentError, isLoading: contentLoading } = useInstagramSharedById(id);
  const { data: pages, error: pagesError, isLoading: pagesLoading } = useInstagramSharedPagesPublic(instagramContent?.book_id);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  if (contentLoading || pagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (contentError || pagesError || !instagramContent) {
    console.error('Instagram content error:', contentError || pagesError);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              Instagram Share Not Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This Instagram share is no longer available or you don't have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="h-5 w-5" />
              No Pages Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This Instagram share doesn't have any pages available yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];
  const previousPage = currentPageIndex > 0 ? pages[currentPageIndex - 1] : undefined;

  const handleNext = () => {
    if (currentPageIndex < pages.length - 1) {
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
      bookId={instagramContent.book_id}
      pageNumber={currentPageIndex + 1}
      totalPages={pages.length}
      previousPage={previousPage}
      onNext={handleNext}
      onPrevious={previousPage ? handlePrevious : undefined}
    />
  );
}