import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBooks } from '@/hooks/useBooks';
import { useBookSeoMetadata } from '@/hooks/useBookSeoMetadata';
import { BookOpen, Calendar, Users } from 'lucide-react';
import { CreateBookModal } from '@/components/books/CreateBookModal';
import { LoadingState } from '@/components/ui/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useResponsiveImageSize } from '@/hooks/useResponsiveImageSize';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useImagePreloading } from '@/hooks/useImagePreloading';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import { useIsMobile } from '@/hooks/use-mobile';

function BookCard({ book, onClick }: { book: any; onClick: () => void }) {
  const { data: seoMetadata } = useBookSeoMetadata(book.id);
  const { width, height } = useResponsiveImageSize();
  const isMobile = useIsMobile();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Custom lazy loading with mobile-optimized threshold
  const { ref, inView } = useIntersectionObserver({
    rootMargin: isMobile ? '300px' : '500px',
    threshold: 0.1,
    triggerOnce: true,
  });
  
  const optimizedImageUrl = getOptimizedImageUrl(seoMetadata?.og_image_url, {
    width,
    height,
  });

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow group overflow-hidden"
      onClick={onClick}
    >
      {optimizedImageUrl && !imageError && (
        <AspectRatio ratio={3/2} ref={ref}>
          {!inView || !imageLoaded ? (
            <Skeleton className="w-full h-full" />
          ) : null}
          {inView && (
            <img 
              src={optimizedImageUrl}
              alt={book.book_name}
              className={`object-cover w-full h-full transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              decoding="async"
              fetchPriority={inView ? "high" : "low"}
            />
          )}
        </AspectRatio>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {book.book_name}
          </CardTitle>
          <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
            {book.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {book.book_description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(book.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {book.category || 'General'}
            </div>
          </div>
          <div className="text-xs bg-muted px-2 py-1 rounded">
            {book.total_pages || 0} pages
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Books() {
  const { user, loading: authLoading } = useAuthContext();
  const { books, loading } = useBooks();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Preload critical images for better performance
  useImagePreloading(books);

  // Redirect to auth if not authenticated (but not if already on auth page)
  if (!authLoading && !user && location.pathname !== '/auth') {
    navigate('/auth');
    return null;
  }

  const handleViewBook = (bookId: string) => {
    navigate(`/editor/${bookId}`);
  };

  const handleCreateNewBook = () => {
    setShowCreateModal(true);
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <StandardPageLayout title="My Books" containerClassName="py-8">
        <LoadingState />
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <StandardPageLayout title="My Books" containerClassName="py-8">
        <LoadingState text="Loading your books..." />
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout title="My Books" containerClassName="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
            <p className="text-muted-foreground">
              Create and manage your ABC books
            </p>
          </div>
          <Button onClick={handleCreateNewBook}>
            <BookOpen className="mr-2 h-4 w-4" />
            Create New Book
          </Button>
        </div>

        {/* Books Grid */}
        {books && books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => handleViewBook(book.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first ABC book to get started
              </p>
              <Button onClick={handleCreateNewBook}>
                <BookOpen className="mr-2 h-4 w-4" />
                Create Your First Book
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Book Modal */}
        <CreateBookModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />
      </div>
    </StandardPageLayout>
  );
}