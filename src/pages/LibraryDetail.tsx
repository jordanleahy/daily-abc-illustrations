import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { StandardPageLayout } from '@/components/layout';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Calendar, Users } from 'lucide-react';
import { MetaHead } from '@/components/common/MetaHead';
import { useSeoMetadata, useSeoMetadataByBook } from '@/hooks/useSeoMetadata';
import { LibraryCard } from '@/components/page-prompts/LibraryCard';
import { trackBookViewForCache, trackBookView } from '@/utils/bookViewTracking';
import { useLibraryDetailImagePreloader } from '@/hooks/useLibraryDetailImagePreloader';
import { Skeleton } from '@/components/ui/skeleton';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import type { Page } from '@/types/book';

/**
 * Lazy-loading card wrapper with viewport detection
 * Loads cards progressively as they approach the viewport
 */
function LazyLibraryCard({ 
  page, 
  bookId, 
  index, 
  isCurrentPage, 
  onClick 
}: { 
  page: Page; 
  bookId: string; 
  index: number; 
  isCurrentPage: boolean; 
  onClick: () => void;
}) {
  const { ref, inView } = useIntersectionObserver({
    rootMargin: '400px', // Start loading 400px before entering viewport
    threshold: 0,
    triggerOnce: true // Once loaded, keep it loaded
  });

  // First 3 cards always render immediately (above fold)
  const shouldRenderImmediately = index < 3;
  const priority = shouldRenderImmediately;

  if (shouldRenderImmediately) {
    return (
      <div
        className={`cursor-pointer transition-all duration-200 ${
          isCurrentPage 
            ? 'ring-2 ring-primary shadow-lg' 
            : 'hover:shadow-md'
        }`}
        onClick={onClick}
      >
        <LibraryCard page={page} bookId={bookId} priority={priority} />
      </div>
    );
  }

  // Below fold: skeleton until in view
  return (
    <div
      ref={ref}
      className={`cursor-pointer transition-all duration-200 ${
        isCurrentPage 
          ? 'ring-2 ring-primary shadow-lg' 
          : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      {inView ? (
        <LibraryCard page={page} bookId={bookId} priority={false} />
      ) : (
        <Card className="h-[400px]">
          <CardContent className="p-4">
            <Skeleton className="w-full h-full" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const { data: book, isLoading: bookLoading, error: bookError } = useLibraryBookById(id);
  const { data: pages = [], isLoading: pagesLoading } = useDailyPublishedPages(id);
  const { data: seoMetadata } = useSeoMetadata(id);
  const { data: bookSeoMetadata } = useSeoMetadataByBook(book?.book_id || undefined);
  
  // Progressive image preloading - priority images load first
  const { priorityCount, totalCount } = useLibraryDetailImagePreloader(book?.book_id);
  
  // 🚀 Predictive prefetching: Anticipate which books user will view next
  // Prefetches the top 3 most likely books based on favorites and viewing history
  const { predictedBooks } = usePredictivePrefetch(id);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Track book view for cache management and database
  useEffect(() => {
    if (id) {
      trackBookViewForCache(id);
      trackBookView(id); // Update database for Recently Viewed
    }
  }, [id]);

  const handleBack = () => {
    navigate('/library');
  };

  // Only show full loading skeleton on first load with no data
  const isInitialLoading = (bookLoading || pagesLoading) && !book && pages.length === 0;

  const pageTitle = seoMetadata?.seo_title || bookSeoMetadata?.seo_title || book?.title || 'ABC Cards Library';
  const pageDescription =
    seoMetadata?.seo_description ||
    bookSeoMetadata?.seo_description ||
    book?.description ||
    (book?.title ? `Explore the ABC book "${book.title}" in our educational library.` : undefined);
  const ogImageUrl = seoMetadata?.og_image_url || bookSeoMetadata?.og_image_url;


  if (!user) {
    return (
      <StandardPageLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please sign in to view library content.</p>
        </div>
      </StandardPageLayout>
    );
  }

  if (isInitialLoading) {
    return (
      <StandardPageLayout>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  if (bookError || !book) {
    return (
      <StandardPageLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The book you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <>
      <MetaHead metadata={{
        title: pageTitle,
        description: pageDescription,
        type: "article",
        image: ogImageUrl ? { url: ogImageUrl } : undefined
      }} />
      
      <StandardPageLayout>
        <div className="space-y-6">
          {/* Navigation Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Button>
          </div>

          {/* Book Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl md:text-3xl">
                    {pageTitle}
                  </CardTitle>
                  {pageDescription && (
                    <p className="text-muted-foreground text-lg">
                      {pageDescription}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="w-fit">
                  {book.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Published {new Date(book.publish_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  General
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {pages.length} pages
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          {pages.length > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                      disabled={currentPageIndex === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-3">
                      Page {currentPageIndex + 1} of {pages.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                      disabled={currentPageIndex === pages.length - 1}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Letter: {pages[currentPageIndex]?.letter || 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Page Display - Priority Load */}
          {pages.length > 0 && pages[currentPageIndex] && (
            <LibraryCard
              page={pages[currentPageIndex]}
              bookId={book.book_id || book.id}
              priority={true}
            />
          )}

          {/* All Pages Grid - Progressive Loading */}
          {pages.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>All Pages</CardTitle>
                {pagesLoading && (
                  <p className="text-sm text-muted-foreground">
                    Loading pages...
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pages.map((page, index) => (
                    <LazyLibraryCard
                      key={page.id}
                      page={page}
                      bookId={book.book_id || book.id}
                      index={index}
                      isCurrentPage={currentPageIndex === index}
                      onClick={() => setCurrentPageIndex(index)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {pages.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pages Available</h3>
                <p className="text-muted-foreground">
                  This book doesn't have any pages to display yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </StandardPageLayout>
    </>
  );
}