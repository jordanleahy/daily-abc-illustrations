import { useParams, useNavigate } from 'react-router-dom';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { useDailyPublishedImagePreloader } from '@/hooks/useDailyPublishedImagePreloader';
import { useDailyPublishedOpenGraph } from '@/hooks/useDailyPublishedOpenGraph';
import { MetaHead } from '@/components/common';
import { StandardPageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicPageImage } from '@/components/daily-published';
import { ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import { isValidUUID } from '@/utils/uuid';
import { formatDistanceToNow } from 'date-fns';

export default function UserLibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const safeId = id && isValidUUID(id) ? id : undefined;
  
  const { data: dailyContent, isLoading: isLoadingDaily, error: dailyError } = useLibraryBookById(safeId);
  const { data: pages = [], isLoading: isLoadingPages } = useDailyPublishedPages(dailyContent?.book_id);
  const { openGraphMetadata } = useDailyPublishedOpenGraph(safeId, 0);
  
  // Preload all page images for instant display
  useDailyPublishedImagePreloader(pages, dailyContent?.book_id);
  
  const isLoading = isLoadingDaily || isLoadingPages;

  const handlePageClick = (pageIndex: number) => {
    navigate(`/library/${id}`, { 
      state: { 
        startingPageIndex: pageIndex,
        from: 'user-library-detail' 
      } 
    });
  };

  const handleBack = () => {
    navigate('/library');
  };

  if (isLoading) {
    return (
      <StandardPageLayout title="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading book details...</p>
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  if (dailyError || !dailyContent) {
    return (
      <StandardPageLayout title="Book Not Found">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Book Not Found</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              This book could not be found in your library.
            </p>
          </div>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </StandardPageLayout>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <StandardPageLayout title={dailyContent.title}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">No Pages Available</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              This book doesn't have any pages to display yet.
            </p>
          </div>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </StandardPageLayout>
    );
  }

  const publishedDate = dailyContent.publish_date 
    ? new Date(dailyContent.publish_date)
    : new Date(dailyContent.published_at);

  return (
    <>
      {openGraphMetadata && <MetaHead metadata={openGraphMetadata} />}
      
      <StandardPageLayout>
        {/* Header Section */}
        <div className="space-y-6 mb-8">
          <Button onClick={handleBack} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>

          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">{dailyContent.title}</h1>
              {dailyContent.description && (
                <p className="text-muted-foreground">{dailyContent.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Published {formatDistanceToNow(publishedDate, { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>{pages.length} pages</span>
              </div>
            </div>

            <Button 
              onClick={() => handlePageClick(0)} 
              size="lg"
              className="w-full sm:w-auto"
            >
              Start from Beginning (A)
            </Button>
          </div>
        </div>

        {/* Page Gallery Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Choose Your Starting Page</h2>
          <p className="text-sm text-muted-foreground">
            Click any letter to start reading from that page
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pages.map((page, index) => (
              <Card
                key={page.id}
                className="group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border-2 border-transparent hover:border-primary/20"
                onClick={() => handlePageClick(index)}
              >
                <div className="relative aspect-square">
                  {/* Letter Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center font-bold text-xl shadow-md">
                    {page.letter}
                  </div>

                  {/* Page Image */}
                  <PublicPageImage
                    pageId={page.id}
                    bookId={dailyContent.book_id}
                    className="w-full h-full object-cover"
                    showUploadButton={false}
                  />

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white font-medium text-sm line-clamp-2">
                      {page.title}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </StandardPageLayout>
    </>
  );
}
