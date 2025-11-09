import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedLibrary } from '@/hooks/useUnifiedLibrary';
import { useLibraryImagePreloader } from '@/hooks/useLibraryImagePreloader';
import { useAggressiveLibraryPrefetch } from '@/hooks/useAggressiveLibraryPrefetch';
import { useDailyPublished } from '@/hooks/useDailyPublished';
import { useLibraryPrefetch } from '@/hooks/useLibraryPrefetch';
import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch';
import { MetaHead } from '@/components/common/MetaHead';
import { StandardPageLayout } from '@/components/layout';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookImage } from '@/components/ui/book-image';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Users, Heart } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { Book } from '@/types/book';
import { trackBookView } from '@/utils/bookViewTracking';
import { useFavorites } from '@/hooks/useFavorites';
import { PremiumContentWrapper } from '@/components/subscription/PremiumContentWrapper';
import { PremiumGate } from '@/components/subscription/PremiumGate';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export default memo(function Library() {
  const navigate = useNavigate();
  const { myBooks, libraryBooks, hasLibraryAccess, isLoading } = useUnifiedLibrary();
  
  // Get the current active daily published book
  const { data: activeDailyPublished } = useDailyPublished();
  
  // Get user favorites
  const { favoriteIds, toggleFavorite, favorites } = useFavorites();
  
  // Preload library images for instant display
  useLibraryImagePreloader(libraryBooks);
  
  // PHASE 1: Aggressive prefetch all book pages in background
  useAggressiveLibraryPrefetch(libraryBooks, true);
  
  // Hover prefetch for instant navigation
  const { prefetchLibraryBook, prefetchLibraryPages } = useLibraryPrefetch();
  
  // 🚀 Predictive prefetching: Anticipate which books user will view next
  // Prefetches the top 3 most likely books based on favorites and viewing history
  const { predictedBooks } = usePredictivePrefetch();

  // Show loading only on first load
  if (isLoading) {
    return (
      <StandardPageLayout>
        <LoadingState text="Loading library..." />
      </StandardPageLayout>
    );
  }

  // Sort user's books by creation date (newest first)
  const sortedMyBooks = [...myBooks].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Sort library books by favorites, then respect the database order
  const sortedLibraryBooks = [...libraryBooks].sort((a, b) => {
    const aIsFavorite = favoriteIds.has(a.id);
    const bIsFavorite = favoriteIds.has(b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    if (aIsFavorite && bIsFavorite) {
      const aFavorite = favorites.find(f => f.daily_published_id === a.id);
      const bFavorite = favorites.find(f => f.daily_published_id === b.id);
      const aTime = aFavorite ? new Date(aFavorite.created_at).getTime() : 0;
      const bTime = bFavorite ? new Date(bFavorite.created_at).getTime() : 0;
      return bTime - aTime;
    }
    
    return 0;
  });

  return (
    <>
      <MetaHead metadata={{
        title: "Library - Daily ABC Illustrations",
        description: "Your books and our daily published ABC illustration books.",
        type: "website"
      }} />
      
      <StandardPageLayout containerClassName="pb-8">
        <div className="space-y-12">
          {/* My Books Section - Always Visible */}
          {sortedMyBooks.length > 0 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">My Books</h2>
                <p className="text-muted-foreground">
                  Books you've created
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedMyBooks.map((book) => (
                  <MyBookCard 
                    key={book.id} 
                    book={book as Book}
                    onClick={() => navigate(`/books/${book.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Official Library Section - Subscription Required */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Official Library</h2>
              <p className="text-muted-foreground">
                Daily published ABC books
              </p>
            </div>

            {!hasLibraryAccess ? (
              <PremiumGate
                feature="Library Access"
                description="Subscribe to unlock access to our daily published ABC books"
                showUpgrade={true}
              >
                <div />
              </PremiumGate>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sortedLibraryBooks.map((item, index) => (
                    <LibraryBookCard 
                      key={item.id} 
                      item={item} 
                      index={index}
                      isNewlyPublished={item.id === activeDailyPublished?.id}
                      isFavorited={favoriteIds.has(item.id)}
                      onToggleFavorite={toggleFavorite}
                      onHover={() => {
                        prefetchLibraryBook(item.id);
                        if (item.book_id) {
                          prefetchLibraryPages(item.book_id);
                        }
                      }}
                    />
                  ))}
                </div>

                {sortedLibraryBooks.length === 0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No books in library yet</h3>
                      <p className="text-muted-foreground">
                        Check back soon for new daily illustrations!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </section>

          {/* Empty State - No Books at All */}
          {sortedMyBooks.length === 0 && sortedLibraryBooks.length === 0 && !hasLibraryAccess && (
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No books yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first ABC book or subscribe to access the library
                  </p>
                </div>
                <Button onClick={() => navigate('/google-chat')}>
                  Create Your First Book
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </StandardPageLayout>
    </>
  );
});

// My Book Card Component
interface MyBookCardProps {
  book: Book;
  onClick: () => void;
}

const MyBookCard = memo(function MyBookCard({ book, onClick }: MyBookCardProps) {
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-xl line-clamp-2">
          {book.book_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={book.status === 'published' ? 'default' : 'secondary'}>
            {book.status}
          </Badge>
          {book.dailyPublishedStatus && (
            <Badge variant="outline">
              {book.dailyPublishedStatus}
            </Badge>
          )}
        </div>
        
        <div className="aspect-video rounded-lg flex items-center justify-center overflow-hidden bg-muted">
          <BookOpen className="w-12 h-12 text-muted-foreground" />
        </div>

        {book.book_description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {book.book_description}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

// Library Book Card Component
interface LibraryBookCardProps {
  item: DailyPublishedWithBook;
  index: number;
  isNewlyPublished?: boolean;
  isFavorited?: boolean;
  onToggleFavorite: (dailyPublishedId: string) => void;
  onHover?: () => void;
}

const LibraryBookCard = memo(function LibraryBookCard({ 
  item, 
  index, 
  isNewlyPublished, 
  isFavorited = false,
  onToggleFavorite,
  onHover
}: LibraryBookCardProps) {
  const navigate = useNavigate();
  
  // Viewport-based lazy loading
  const { ref, inView } = useIntersectionObserver({
    rootMargin: '200px', // Start loading 200px before entering viewport
    triggerOnce: true, // Once loaded, stay loaded
  });
  
  // Priority loading for first 6 cards (above fold)
  const shouldLoadImmediately = index < 6;
  const shouldRender = shouldLoadImmediately || inView;
  
  const handleCardClick = () => {
    // Track the book view for sorting
    trackBookView(item.id);
    
    // Navigate to detail page to choose starting page
    navigate(`/library/${item.id}/detail`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onToggleFavorite(item.id);
  };

  return (
    <Card 
      ref={ref}
      className="hover:shadow-lg transition-shadow cursor-pointer relative"
      onClick={handleCardClick}
      onMouseEnter={onHover}
    >
      {/* Favorite Heart Button */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart 
          className={`w-5 h-5 transition-colors ${
            isFavorited 
              ? 'fill-red-500 text-red-500' 
              : 'text-muted-foreground hover:text-red-500'
          }`}
        />
      </button>

        <CardHeader>
          <div className="flex items-start justify-between gap-2 pr-12">
            <CardTitle className="text-xl line-clamp-2 flex-1">
              {item.seo_title || item.title}
            </CardTitle>
            {isNewlyPublished && (
              <Badge variant="default" className="shrink-0">
                Published Today
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              26 pages
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(item.publish_date).toLocaleDateString()}
            </div>
          </div>
          
          <div className="aspect-video rounded-lg flex items-center justify-center overflow-hidden relative">
            {shouldRender ? (
              item.og_image_url ? (
                <BookImage
                  src={item.og_image_url}
                  alt={`Preview of ${item.seo_title || item.title}`}
                  priority={index < 6}
                  className="w-full h-full object-cover object-center"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              )
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
  );
});