import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { StandardPageLayout } from '@/components/layout';
import { useLibraryBookByIdDecoupled } from '@/hooks/useLibraryBookByIdDecoupled';
import { useLibraryBookPagesDecoupled } from '@/hooks/useLibraryBookPagesDecoupled';
import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { MetaHead } from '@/components/common/MetaHead';
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
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuthContext();
  const { data: kidProfiles = [] } = useKidProfiles();
  const navigate = useNavigate();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const { data: book, isLoading: bookLoading, error: bookError } = useLibraryBookByIdDecoupled(bookId);
  const { data: pages = [], isLoading: pagesLoading } = useLibraryBookPagesDecoupled(bookId);
  
  // Progressive image preloading - priority images load first
  const { priorityCount, totalCount } = useLibraryDetailImagePreloader(bookId);
  
  // 🚀 Predictive prefetching: Anticipate which books user will view next
  const { predictedBooks } = usePredictivePrefetch(bookId);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Track book view for cache management and database with kid_id for personalized recommendations
  useEffect(() => {
    if (book?.id && user) {
      const kidId = kidProfiles.length > 0 ? kidProfiles[0].id : undefined;
      trackBookView(book.id, kidId);
      trackBookViewForCache(book.id);
    }
  }, [book?.id, user, kidProfiles]);

  const metaTitle = book?.book_name || 'Library Book';
  const metaDescription = book?.book_description || 'View this educational ABC book';

  const handleBack = () => {
    navigate('/library');
  };

  const isLoading = bookLoading || pagesLoading;

  if (isLoading) {
    return (
      <StandardPageLayout>
        <div className="space-y-6">
          <div className="h-10 w-48 bg-muted rounded animate-pulse"></div>
          <div className="h-32 bg-muted rounded animate-pulse"></div>
          <div className="h-12 bg-muted rounded animate-pulse"></div>
          <div>
            <div className="h-8 w-32 mb-4 bg-muted rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        title: metaTitle,
        description: metaDescription,
        type: "article"
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
              <CardTitle className="text-2xl md:text-3xl">
                {book.book_name}
              </CardTitle>
              {book.book_description && (
                <p className="text-muted-foreground text-lg">
                  {book.book_description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {pages.length} pages
                </div>
              </div>
              
              <Button 
                className="mt-4"
                onClick={() => navigate(`/library/${bookId}/read`, { 
                  state: { 
                    startingPageIndex: currentPageIndex,
                    from: 'library-detail'
                  } 
                })}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Start Reading
              </Button>
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Page Display */}
          {pages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {pages[currentPageIndex].title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LazyLibraryCard
                  page={pages[currentPageIndex]}
                  bookId={bookId!}
                  index={currentPageIndex}
                  isCurrentPage={true}
                  onClick={() => {}}
                />
              </CardContent>
            </Card>
          )}

          {/* All Pages Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">All Pages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page, index) => (
                <LazyLibraryCard
                  key={page.id}
                  page={page}
                  bookId={bookId!}
                  index={index}
                  isCurrentPage={index === currentPageIndex}
                  onClick={() => {
                    setCurrentPageIndex(index);
                    navigate(`/library/${bookId}/read`, { 
                      state: { 
                        startingPageIndex: index,
                        from: 'library-detail'
                      } 
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </StandardPageLayout>
    </>
  );
}
