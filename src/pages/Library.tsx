import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryBooksDecoupled } from '@/hooks/useLibraryBooksDecoupled';
import { useFavorites } from '@/hooks/useFavorites';
import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch';
import { MetaHead } from '@/components/common/MetaHead';
import { StandardPageLayout } from '@/components/layout';
import { LoadingState } from '@/components/ui/loading-state';
import { PremiumGate } from '@/components/subscription/PremiumGate';
import { Card } from '@/components/ui/card';
import { BookImage } from '@/components/ui/book-image';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { trackBookView } from '@/utils/bookViewTracking';
import { format } from 'date-fns';
import { Calendar, BookOpen } from 'lucide-react';

const Library = memo(() => {
  const navigate = useNavigate();
  const { hasLibraryAccess } = useFeatureAccess();
  
  const { data: libraryBooks = [], isLoading: isLoadingLibrary } = useLibraryBooksDecoupled();
  const { favorites } = useFavorites();

  // Prefetch strategies (disabled for now)

  // Sort books by most recent updated_at only
  const sortedBooks = useMemo(() => {
    return [...libraryBooks].sort((a, b) => {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [libraryBooks]);

  if (isLoadingLibrary) {
    return (
      <StandardPageLayout>
        <LoadingState text="Loading library..." />
      </StandardPageLayout>
    );
  }

  return (
    <>
      <MetaHead metadata={{
        title: "Library - Daily ABC Illustrations",
        description: "Your books and our daily published ABC illustration books.",
        type: "website"
      }} />
      
      <StandardPageLayout containerClassName="pb-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Library</h2>
            <p className="text-muted-foreground">
              Your collection of ABC books
            </p>
          </div>

          {!hasLibraryAccess ? (
            <PremiumGate>
              <p className="text-center">Subscribe to access the full library of ABC books</p>
            </PremiumGate>
          ) : sortedBooks.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No books in library yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBooks.map((book) => (
              <LibraryBookCard
                key={book.id}
                book={book}
              />
            ))}
            </div>
          )}
        </div>
      </StandardPageLayout>
    </>
  );
});

Library.displayName = 'Library';

export default Library;

// ===== LibraryBookCard Component =====

interface LibraryBookCardProps {
  book: {
    id: string;
    book_name: string;
    book_description?: string;
    created_at: string;
    total_pages?: number;
    cover_image?: string | null;
    is_highlighted?: boolean;
  };
}

const LibraryBookCard = memo(({ book }: LibraryBookCardProps) => {
  const navigate = useNavigate();
  const { ref: cardRef, inView: isInView } = useIntersectionObserver({ threshold: 0.1 });

  const handleCardClick = () => {
    trackBookView(book.id);
    navigate(`/library/${book.id}`, {
      state: { from: 'library-card' }
    });
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className="group relative bg-card hover:bg-accent/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="aspect-square relative overflow-hidden bg-muted">
        {book.cover_image ? (
          <BookImage
            src={book.cover_image}
            alt={book.book_name}
            className="w-full h-full object-cover"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-2">{book.book_name}</h3>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {book.book_description || 'No description available'}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(book.created_at), 'MMM d, yyyy')}
            </span>
            {book.total_pages && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {book.total_pages} pages
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

LibraryBookCard.displayName = 'LibraryBookCard';
