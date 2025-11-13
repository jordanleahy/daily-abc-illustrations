import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBooks } from '@/hooks/useBooks';
import { useBookSeoMetadata } from '@/hooks/useBookSeoMetadata';
import { BookOpen, Calendar, Users } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { trackUserBookActivity } from '@/utils/bookViewTracking';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useEditorImagePreloader } from '@/hooks/useEditorImagePreloader';
import { BookImage } from '@/components/ui/book-image';
import { useScheduleBookPublication } from '@/hooks/useScheduleBookPublication';
import { useDeleteDailyPublished } from '@/hooks/useDeleteDailyPublished';
import type { DailyPublished } from '@/types/dailyPublished';

/**
 * UserBookCard - Displays a book authored by the current user in "My Books" section
 * 
 * @description Shows user-created books with edit capabilities, status badges,
 * and metadata including book type, character themes, and page counts.
 * Used exclusively in the user's personal book management interface.
 * 
 * @data-source useBooks() - Fetches from books table filtered by user_id
 * @navigation Routes to /books/:id for detailed editing view
 * @user-context Book authors managing their own created content
 * @features Status badge, metadata badges (book type, pages, themes), edit access,
 * thumbnail display with fallback, viewport-based lazy loading
 */

interface UserBookCardProps {
  book: any;
  onClick: () => void;
  index: number;
  onEditClick?: (bookId: string) => void;
  publicationStatus?: Pick<DailyPublished, 'id' | 'status' | 'publish_date'> | null;
  onPublish?: (bookId: string, title: string, description?: string) => void;
  onUnpublish?: (dailyPublishedId: string) => void;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
}

function UserBookCard({ 
  book, 
  onClick, 
  index, 
  onEditClick,
  publicationStatus,
  onPublish,
  onUnpublish,
  isPublishing,
  isUnpublishing
}: UserBookCardProps) {
  const { data: seoMetadata } = useBookSeoMetadata(book.id);
  
  // Viewport-based lazy loading
  const { ref, inView } = useIntersectionObserver({
    rootMargin: '200px',
    triggerOnce: true,
  });
  
  // Priority loading for first 6 cards
  const shouldLoadImmediately = index < 6;
  const shouldRender = shouldLoadImmediately || inView;

  return (
    <Card 
      ref={ref}
      className="cursor-pointer hover:shadow-lg transition-shadow group overflow-hidden"
      onClick={onClick}
    >
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
      <CardContent className="space-y-4">
        {/* Book Thumbnail */}
        <AspectRatio ratio={1} className="bg-muted rounded-lg overflow-hidden">
          {shouldRender ? (
            book.coverImageUrl || book.thumbnail_url || seoMetadata?.og_image_url ? (
              <BookImage
                src={book.coverImageUrl || book.thumbnail_url || seoMetadata?.og_image_url}
                alt={book.book_name}
                priority={index < 6}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            )
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
        </AspectRatio>

        {/* Book Metadata Badges */}
        <div className="flex flex-wrap gap-2">
          {book.metadata?.bookType && (
            <Badge variant="secondary" className="capitalize">
              {book.metadata.bookType.replace(/-/g, ' ')}
            </Badge>
          )}
          {book.metadata?.pageCount && (
            <Badge variant="outline">
              {book.metadata.pageCount} pages
            </Badge>
          )}
          {book.metadata?.numberRange && (
            <Badge variant="outline">
              Numbers {book.metadata.numberRange}
            </Badge>
          )}
          {book.metadata?.characterTheme && (
            <Badge variant="default" className="capitalize">
              {book.metadata.characterTheme.replace(/-/g, ' ')}
            </Badge>
          )}
          {book.metadata?.letterCase && (
            <Badge variant="outline" className="capitalize">
              {book.metadata.letterCase} letters
            </Badge>
          )}
          {book.metadata?.targetAge && (
            <Badge variant="secondary" className="capitalize">
              {book.metadata.targetAge.replace(/-/g, ' ')}
            </Badge>
          )}
        </div>

        {/* Edit Button */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            if (onEditClick) {
              onEditClick(book.id);
            }
          }}
        >
          Edit
        </Button>

        {/* Publish/Unpublish Button */}
        <Button 
          variant={publicationStatus ? "destructive" : "default"}
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            if (publicationStatus && onUnpublish) {
              onUnpublish(publicationStatus.id);
            } else if (onPublish) {
              onPublish(book.id, book.book_name, book.book_description);
            }
          }}
          disabled={isPublishing || isUnpublishing}
        >
          {isPublishing || isUnpublishing ? (
            <>Loading...</>
          ) : publicationStatus ? (
            <>Unpublish from Library</>
          ) : (
            <>Publish to Library</>
          )}
        </Button>

        {/* Publication Status Badge */}
        {publicationStatus && (
          <div className="text-xs text-center text-muted-foreground mt-1">
            {publicationStatus.status === 'active' && (
              <span className="text-green-600 font-medium">🟢 Live in Library</span>
            )}
            {publicationStatus.status === 'queued' && (
              <span className="text-blue-600 font-medium">
                📅 Scheduled for {new Date(publicationStatus.publish_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
            {publicationStatus.status === 'expired' && (
              <span className="text-gray-600 font-medium">⏸️ Expired</span>
            )}
          </div>
        )}

        {/* Book Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
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
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const schedulePublication = useScheduleBookPublication();
  const deletePublication = useDeleteDailyPublished();
  
  // Determine view mode based on route
  const isAllBooksView = location.pathname.startsWith('/all-books');
  const viewMode = isAllBooksView ? 'all-books' : 'my-books';
  
  const { books, loading } = useBooks(viewMode);

  // Preload book images for instant display on return visits
  useEditorImagePreloader(books);

  // Invalidate books query when route changes to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
  }, [location.pathname, queryClient]);

  const handleViewBook = async (bookId: string) => {
    // Track the user book activity (writes to user_book_activity table with book_id)
    trackUserBookActivity(bookId);
    
    // Invalidate query to refresh sort order with new activity
    queryClient.invalidateQueries({ queryKey: ['books', user?.id] });
    
    // Navigate based on context
    if (isAllBooksView) {
      navigate(`/all-books/${bookId}`); // Admin editor
    } else {
      navigate(`/books/${bookId}/read`, { state: { from: 'my-books' } }); // Reading view with back navigation
    }
  };

  const handleCreateNewBook = () => {
    navigate('/google-chat'); // Redirect to GoogleChat page for book creation
  };

  const handlePublish = (bookId: string, title: string, description?: string) => {
    schedulePublication.mutate({ bookId, title, description });
  };

  const handleUnpublish = (dailyPublishedId: string) => {
    deletePublication.mutate(dailyPublishedId);
  };

  const pageTitle = isAllBooksView ? "All Books" : "My Books";
  const pageDescription = isAllBooksView 
    ? "View and manage all ABC books in the system" 
    : "Create and manage your ABC books";

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <StandardPageLayout title={pageTitle} containerClassName="py-8">
        <LoadingState />
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <StandardPageLayout title={pageTitle} containerClassName="py-8">
        <LoadingState text="Loading your books..." />
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout title={pageTitle} containerClassName="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground">
              {pageDescription}
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
            {books.map((book, index) => (
              <UserBookCard
                key={book.id}
                book={book}
                index={index}
                onClick={() => handleViewBook(book.id)}
                onEditClick={(bookId) => navigate('/chat', { state: { editBookId: bookId } })}
                publicationStatus={book.daily_published?.[0] ? {
                  id: book.daily_published[0].id,
                  status: book.daily_published[0].status as 'draft' | 'queued' | 'active' | 'expired',
                  publish_date: book.daily_published[0].publish_date
                } : null}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                isPublishing={schedulePublication.isPending}
                isUnpublishing={deletePublication.isPending}
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
      </div>
    </StandardPageLayout>
  );
}