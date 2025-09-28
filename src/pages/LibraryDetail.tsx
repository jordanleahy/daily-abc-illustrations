import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { StandardPageLayout } from '@/components/layout';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Calendar, Users } from 'lucide-react';
import { MetaHead } from '@/components/common/MetaHead';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { LibraryCard } from '@/components/page-prompts/LibraryCard';

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const { data: book, isLoading: bookLoading, error: bookError } = useLibraryBookById(id);
  const { data: pages = [], isLoading: pagesLoading } = useDailyPublishedPages(id);
  const { data: seoMetadata } = useSeoMetadata(id);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleBack = () => {
    navigate('/library');
  };

  const isLoading = bookLoading || pagesLoading;

  if (!user) {
    return (
      <StandardPageLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please sign in to view library content.</p>
        </div>
      </StandardPageLayout>
    );
  }

  if (isLoading) {
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
        title: `${book.title} - ABC Cards Library`,
        description: book.description || `Explore the ABC book "${book.title}" in our educational library.`,
        type: "article",
        image: seoMetadata?.og_image_url ? { url: seoMetadata.og_image_url } : undefined
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
                    {book.title}
                  </CardTitle>
                  {book.description && (
                    <p className="text-muted-foreground text-lg">
                      {book.description}
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

          {/* Current Page Display */}
          {pages.length > 0 && pages[currentPageIndex] && (
            <LibraryCard
              page={pages[currentPageIndex]}
              bookId={book.book_id || book.id}
            />
          )}

          {/* All Pages Grid (collapsed by default) */}
          {pages.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>All Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pages.map((page, index) => (
                    <div
                      key={page.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        currentPageIndex === index 
                          ? 'ring-2 ring-primary shadow-lg' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setCurrentPageIndex(index)}
                    >
                      <LibraryCard
                        page={page}
                        bookId={book.book_id || book.id}
                      />
                    </div>
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