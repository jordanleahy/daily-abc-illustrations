/**
 * LibraryBookView - Library Books
 * 
 * ⚠️ Uses UnifiedReadingView (shared component)
 * Changes to UnifiedReadingView will affect this view
 * 
 * Displays books from the library at /library/:id route
 * Configuration:
 * - contentType: 'library_book'
 * - showUploadButton: false (read-only)
 * - showSwipeDrawer: false
 * - Uses PublicPageImage component
 */

import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLibraryBookByIdDecoupled } from '@/hooks/useLibraryBookByIdDecoupled';
import { useLibraryBookPagesDecoupled } from '@/hooks/useLibraryBookPagesDecoupled';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { useLibraryBookImagePreloader } from '@/hooks/useLibraryBookImagePreloader';
import { useAuthContext } from '@/contexts/AuthContext';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { trackBookView } from '@/utils/bookViewTracking';
import { Card } from '@/components/ui/card';
import { BookImage } from '@/components/ui/book-image';
import { UnifiedReadingView } from '@/components/reading';
import { RoleDebugger } from '@/components/RoleDebugger';
import { Calendar } from 'lucide-react';
import { isValidUUID } from '@/utils/uuid';
import { useEffect } from 'react';

export default function LibraryBookView() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { data: kidProfiles = [] } = useKidProfiles();
  const safeBookId = bookId && isValidUUID(bookId) ? bookId : undefined;
  
  const { data: book, isLoading: isLoadingBook, error: bookError } = useLibraryBookByIdDecoupled(safeBookId);
  const { data: pages = [], isLoading: isLoadingPages } = useLibraryBookPagesDecoupled(safeBookId);
  const { data: imageMap = {} } = useBookPageImages(safeBookId);
  
  // Preload library images with optimization and caching
  useLibraryBookImagePreloader(safeBookId, pages);
  
  // Track book view when page loads with kid_id for personalized recommendations
  useEffect(() => {
    if (book?.id && user) {
      const kidId = kidProfiles.length > 0 ? kidProfiles[0].id : undefined;
      trackBookView(book.id, kidId);
    }
  }, [book?.id, user, kidProfiles]);
  
  // Get starting page index from location state
  const startingPageIndex = location.state?.startingPageIndex ?? 0;
  
  const isLoading = isLoadingBook || isLoadingPages;

  const handleBack = () => {
    navigate('/library');
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

  const entryPoint = location.state?.from === 'library-detail' ? 'reading_view_button' : 'library_card';

  return (
    <UnifiedReadingView
      contentType="library_book"
      book={{
        id: book.id,
        book_id: book.id,
        title: book.book_name,
      }}
      pages={pages}
      startingPageIndex={startingPageIndex}
      onBack={handleBack}
      showUploadButton={false}
      entryPoint={entryPoint}
      imageComponent={(page) => (
        <BookImage
          src={imageMap[page.page_number]}
          alt={`Letter ${page.letter} - ${page.title}`}
          priority={page.id === pages[startingPageIndex]?.id}
          className="rounded-lg w-full h-full object-contain"
          disableHoverEffects={true}
          enableVisibilityToggle={true}
        />
      )}
    />
  );
}
