import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { StandardPageLayout } from '@/components/layout';
import { useBook } from '@/hooks/useBook';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { usePageImageUrlsSubscription } from '@/hooks/usePageImageUrlsSubscription';
import { useLibraryDetailImagePreloader } from '@/hooks/useLibraryDetailImagePreloader';
import { useScheduleBookPublication } from '@/hooks/useScheduleBookPublication';
import { useBookPublicationStatus } from '@/hooks/useBookPublicationStatus';
import { useHasRole } from '@/hooks/useUserRole';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookOpen, Calendar, Plus, Download, Loader2 } from 'lucide-react';
import { UserPageCard } from '@/components/page-prompts';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { generateBookPDF } from '@/services/pdfGenerator';
import { toast } from 'sonner';
import { trackBookView } from '@/utils/bookViewTracking';
import { useQueryClient } from '@tanstack/react-query';
import type { Page } from '@/types/book';

/**
 * Lazy-loading card wrapper with viewport detection
 */
function LazyPageCard({ 
  page, 
  bookId, 
  pageImageUrl,
  index, 
  isCurrentPage, 
  onClick 
}: { 
  page: Page; 
  bookId: string; 
  pageImageUrl?: string;
  index: number; 
  isCurrentPage: boolean; 
  onClick: () => void;
}) {
  const { ref, inView } = useIntersectionObserver({
    rootMargin: '400px',
    threshold: 0,
    triggerOnce: true
  });

  const shouldRenderImmediately = index < 3;

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
        <UserPageCard 
          page={page} 
          bookId={bookId} 
          preloadedImageUrl={pageImageUrl}
        />
      </div>
    );
  }

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
        <UserPageCard 
          page={page} 
          bookId={bookId} 
          preloadedImageUrl={pageImageUrl}
        />
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

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const { data: book, isLoading: bookLoading, error: bookError, isFetched: bookFetched } = useBook(id);
  const { pages } = useBookPages(id);
  const { data: pageImages = {} } = useBookPageImages(id);
  const { data: publicationStatus } = useBookPublicationStatus(book?.id);
  const { hasActiveSubscription } = useSubscription();
  const isAdmin = useHasRole('admin');
  const schedulePublication = useScheduleBookPublication();
  
  // Subscribe to real-time page image updates
  usePageImageUrlsSubscription(id);
  
  // Progressive image preloading
  useLibraryDetailImagePreloader(id);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Track book view when component loads
    if (user && id && book) {
      trackBookView(id);
      queryClient.invalidateQueries({ queryKey: ['books', user.id] });
    }
  }, [user, id, navigate, authLoading, book, queryClient]);

  useEffect(() => {
    if (!authLoading && user && id && bookFetched && !book) {
      toast.error('Book not found');
      navigate('/books');
    }
  }, [authLoading, user, id, bookFetched, book, navigate]);

  const handleBack = () => {
    navigate('/books');
  };

  const handleSchedulePublication = async () => {
    if (!book?.id || publicationStatus) return;
    
    try {
      await schedulePublication.mutateAsync({
        bookId: book.id,
        title: book.book_name,
        description: book.book_description || undefined,
      });
      
      toast.success('Book scheduled for publication');
    } catch (error) {
      console.error('Error scheduling publication:', error);
      toast.error('Failed to schedule publication');
    }
  };

  const handleDownloadPDF = async () => {
    if (!book?.id || !pages.length) return;
    
    setIsDownloading(true);
    try {
      await generateBookPDF(book.id, book.book_name);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePageClick = (index: number) => {
    setCurrentPageIndex(index);
    // Navigate to reading view starting at this page
    navigate(`/books/${book?.id}/read?page=${index + 1}`);
  };

  if (authLoading || (user && !bookFetched)) {
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
            Back to My Books
          </Button>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Books
          </Button>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Schedule Publication - Admin Only */}
            {isAdmin && !publicationStatus && (
              <Button
                onClick={handleSchedulePublication}
                disabled={schedulePublication.isPending}
                variant="default"
                size="sm"
                className="gap-2"
              >
                {schedulePublication.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Schedule
              </Button>
            )}
            
            {/* Download PDF - Plus Tier */}
            {hasActiveSubscription && (
              <Button
                onClick={handleDownloadPDF}
                disabled={isDownloading || pages.length === 0}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download
              </Button>
            )}
          </div>
        </div>

        {/* Book Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl">
                  {book.book_name}
                </CardTitle>
                {book.book_description && (
                  <p className="text-muted-foreground text-lg">
                    {book.book_description}
                  </p>
                )}
              </div>
              <Badge 
                variant={book.status === 'published' ? 'default' : 'secondary'}
                className={`w-fit ${book.status === 'published' ? 'bg-green-600' : ''}`}
              >
                {book.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created {new Date(book.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {pages.length} pages
              </div>
              {book.category && (
                <Badge variant="outline">{book.category}</Badge>
              )}
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

        {/* Current Page Display */}
        {pages.length > 0 && pages[currentPageIndex] && (
          <div 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handlePageClick(currentPageIndex)}
          >
            <UserPageCard
              page={pages[currentPageIndex]}
              bookId={book.id}
              preloadedImageUrl={pageImages[pages[currentPageIndex].page_number]}
            />
          </div>
        )}

        {/* All Pages Grid */}
        {pages.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>All Pages</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click any page to start reading from that point
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map((page, index) => (
                  <LazyPageCard
                    key={page.id}
                    page={page}
                    bookId={book.id}
                    pageImageUrl={pageImages[page.page_number]}
                    index={index}
                    isCurrentPage={currentPageIndex === index}
                    onClick={() => handlePageClick(index)}
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
  );
}
