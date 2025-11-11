/**
 * BookReadingView - User's Personal Books
 * 
 * ⚠️ Uses UnifiedReadingView (shared component)
 * Changes to UnifiedReadingView will affect this view
 * 
 * Displays user-created books from /books/:id route
 * Configuration:
 * - contentType: 'user_book'
 * - showUploadButton: false (read-only)
 * - showSwipeDrawer: false
 * - Uses PublicPageImage component
 */

import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useBook } from '@/hooks/useBook';
import { useBookPages } from '@/hooks/useBookPages';
import { Card } from '@/components/ui/card';
import { UnifiedReadingView } from '@/components/reading';
import { PublicPageImage } from '@/components/daily-published';
import { RoleDebugger } from '@/components/RoleDebugger';
import { Calendar } from 'lucide-react';
import { isValidUUID } from '@/utils/uuid';

export default function BookReadingView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const safeId = id && isValidUUID(id) ? id : undefined;
  
  const { data: book, isLoading: isLoadingBook, error: bookError } = useBook(safeId);
  const { pages = [], loading: isLoadingPages } = useBookPages(safeId);
  
  // Get starting page index from location state
  const startingPageIndex = location.state?.startingPageIndex ?? 0;
  
  const isLoading = isLoadingBook || isLoadingPages;

  const handleBack = () => {
    // If user came from Google Chat, navigate back to that specific session
    if (location.state?.from === 'google-chat') {
      const sessionId = location.state?.sessionId;
      if (sessionId) {
        navigate(`/google-chat?session=${sessionId}`);
      } else {
        navigate('/google-chat');
      }
    } else {
      navigate('/library');
    }
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

  if (bookError || !book) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Book Not Found</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              This book could not be found in your library.
            </p>
            {bookError && (
              <p className="text-sm text-destructive">
                Error: {bookError.message}
              </p>
            )}
          </div>
        </Card>
        <RoleDebugger />
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold">{book.book_name}</h2>
            <p className="text-sm text-muted-foreground">
              This book doesn't have any pages to display.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const entryPoint = location.state?.from === 'library' ? 'library_card' : 'direct_link';
  const backLabel = location.state?.from === 'google-chat' ? 'Chat' : 'Library';

  return (
    <UnifiedReadingView
      contentType="user_book"
      book={{
        id: book.id,
        book_id: book.id,
        book_name: book.book_name,
        book_description: book.book_description,
      }}
      pages={pages}
      startingPageIndex={startingPageIndex}
      onBack={handleBack}
      backLabel={backLabel}
      showUploadButton={false}
      showSwipeDrawer={false}
      entryPoint={entryPoint}
      imageComponent={(page) => (
        <PublicPageImage 
          pageId={page.id}
          bookId={book.id}
          className="rounded-lg"
          showUploadButton={false}
          isFirstImage={page.id === pages[startingPageIndex]?.id}
        />
      )}
    />
  );
}
