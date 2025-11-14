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
import { useBookCoverImage } from '@/hooks/useBookCoverImage';
import { BookImage } from '@/components/ui/book-image';
import { useScheduleBookPublication } from '@/hooks/useScheduleBookPublication';
import { useDeleteDailyPublished } from '@/hooks/useDeleteDailyPublished';
import { useDeleteBook } from '@/hooks/useDeleteBook';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBookEditor } from '@/components/book/MobileBookEditor';
import { AdminOnly } from '@/components/AdminOnly';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
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
  onDelete?: (bookId: string, bookName: string) => void;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
  isDeleting?: boolean;
}

function UserBookCard({ 
  book, 
  onClick, 
  index, 
  onEditClick,
  publicationStatus,
  onPublish,
  onUnpublish,
  onDelete,
  isPublishing,
  isUnpublishing,
  isDeleting
}: UserBookCardProps) {
  const { data: seoMetadata } = useBookSeoMetadata(book.id);
  const { data: coverImageUrl } = useBookCoverImage(book.id);
  
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
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg group-hover:text-primary transition-colors">
          {book.book_name}
        </CardTitle>
        
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
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Book Thumbnail - Priority: cover page image → thumbnail_url → seo image → placeholder */}
        <AspectRatio ratio={1} className="bg-muted rounded-lg overflow-hidden relative group">
          {shouldRender ? (
            coverImageUrl || book.thumbnail_url || seoMetadata?.og_image_url ? (
              <BookImage
                src={coverImageUrl || book.thumbnail_url || seoMetadata?.og_image_url}
                alt={book.book_name}
                priority={index < 6}
                className="w-full h-full object-cover object-center"
                enableMobileSave={true}
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

        {/* Delete Book Button - Visible to All Users */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => e.stopPropagation()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>Deleting...</>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Book
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{book.book_name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All {book.total_pages || 0} pages</li>
                  <li>All page images and content</li>
                  <li>AI prompts and system configurations</li>
                  <li>Publication records and QR codes</li>
                  <li>SEO metadata and analytics</li>
                </ul>
                {publicationStatus && (
                  <p className="mt-3 font-medium text-destructive">
                    ⚠️ This book is currently {publicationStatus.status === 'active' ? 'live in' : 'scheduled for'} the library!
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) {
                    onDelete(book.id, book.book_name);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Admin-Only Actions Section */}
        <AdminOnly fallback={null}>
          <div className="space-y-2 pt-3 mt-3 border-t border-border/50">
            {/* Section Label */}
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Admin Actions
            </div>
            
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
                <>Publish to Daily Library</>
              )}
            </Button>

            {/* Publication Status Badge */}
            {publicationStatus && (
              <div className="text-xs text-center text-muted-foreground">
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
            
            {/* Future: Additional admin buttons will go here */}
          </div>
        </AdminOnly>

      </CardContent>
    </Card>
  );
}

export default function Books() {
  const { user, loading: authLoading } = useAuthContext();
  const isMobile = useIsMobile();
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const schedulePublication = useScheduleBookPublication();
  const deletePublication = useDeleteDailyPublished();
  const deleteBook = useDeleteBook();
  
  // Mobile editor state
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedBookPublication, setSelectedBookPublication] = useState<Pick<DailyPublished, 'id' | 'status' | 'publish_date'> | null>(null);
  
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

  const handleEditBook = (bookId: string, book: any, publicationStatus?: Pick<DailyPublished, 'id' | 'status' | 'publish_date'> | null) => {
    if (isMobile) {
      setSelectedBookId(bookId);
      setSelectedBook(book); // Store book data for instant display
      setSelectedBookPublication(publicationStatus || null);
      setMobileEditorOpen(true);
    } else {
      navigate('/google-chat', { state: { editBookId: bookId } });
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

  const handleDeleteBook = (bookId: string, bookName: string) => {
    deleteBook.mutate(bookId);
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
    <>
      <MobileBookEditor 
        bookId={selectedBookId}
        open={mobileEditorOpen}
        onOpenChange={setMobileEditorOpen}
        publicationStatus={selectedBookPublication}
        book={selectedBook}
      />
      
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
                onEditClick={(bookId) => {
                  const publicationStatus = book.daily_published?.[0] ? {
                    id: book.daily_published[0].id,
                    status: book.daily_published[0].status as 'draft' | 'queued' | 'active' | 'expired',
                    publish_date: book.daily_published[0].publish_date
                  } : null;
                  handleEditBook(bookId, book, publicationStatus);
                }}
                publicationStatus={book.daily_published?.[0] ? {
                  id: book.daily_published[0].id,
                  status: book.daily_published[0].status as 'draft' | 'queued' | 'active' | 'expired',
                  publish_date: book.daily_published[0].publish_date
                } : null}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                onDelete={handleDeleteBook}
                isPublishing={schedulePublication.isPending}
                isUnpublishing={deletePublication.isPending}
                isDeleting={deleteBook.isPending}
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
    </>
  );
}