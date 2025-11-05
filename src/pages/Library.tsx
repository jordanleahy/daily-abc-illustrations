import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import { useLibraryImagePreloader } from '@/hooks/useLibraryImagePreloader';
import { useDailyPublished } from '@/hooks/useDailyPublished';
import { MetaHead } from '@/components/common/MetaHead';
import { StandardPageLayout } from '@/components/layout';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookImage } from '@/components/ui/book-image';
import { BookOpen, Calendar, Users, Heart } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useIsTeacher } from '@/contexts/RoleContext';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { useAuthContext } from '@/contexts/AuthContext';
import { getBookViewTimestamps, trackBookView } from '@/utils/bookViewTracking';
import { useFavorites } from '@/hooks/useFavorites';
import { PremiumContentWrapper } from '@/components/subscription/PremiumContentWrapper';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

export default memo(function Library() {
  const {
    data: libraryItems,
    isLoading,
    error
  } = useLibraryBooks();
  
  // Get the current active daily published book
  const { data: activeDailyPublished } = useDailyPublished();
  
  // Get user favorites
  const { favoriteIds, toggleFavorite, favorites } = useFavorites();
  
  // Preload book images for instant display
  useLibraryImagePreloader(libraryItems);
  

  if (isLoading) {
    return (
      <StandardPageLayout>
        <LoadingState text="Loading library..." />
      </StandardPageLayout>
    );
  }

  if (error) {
    return (
      <StandardPageLayout>
        <div className="text-center py-8">
          <p className="text-destructive">Error loading library: {error.message}</p>
        </div>
      </StandardPageLayout>
    );
  }

  // Four-tier sorting: Active daily -> Favorites -> Recently Visited -> Unvisited
  const viewTimestamps = getBookViewTimestamps();
  
  // Find the active daily published book from library items
  const activeDailyBook = libraryItems?.find(item => item.id === activeDailyPublished?.id);
  
  // Filter out the active daily book from the rest
  const otherBooks = libraryItems?.filter(item => item.id !== activeDailyPublished?.id) || [];
  
  // Separate favorites from other books
  const favoriteBooks = otherBooks.filter(item => favoriteIds.has(item.id));
  const nonFavoriteBooks = otherBooks.filter(item => !favoriteIds.has(item.id));
  
  // Sort favorites by when they were favorited (most recent first)
  const sortedFavorites = [...favoriteBooks].sort((a, b) => {
    const aFavorite = favorites.find(f => f.daily_published_id === a.id);
    const bFavorite = favorites.find(f => f.daily_published_id === b.id);
    const aTime = aFavorite ? new Date(aFavorite.created_at).getTime() : 0;
    const bTime = bFavorite ? new Date(bFavorite.created_at).getTime() : 0;
    return bTime - aTime; // Most recent first
  });
  
  // Split non-favorites into visited and unvisited books
  const visitedBooks = nonFavoriteBooks.filter(item => viewTimestamps[item.id]);
  const unvisitedBooks = nonFavoriteBooks.filter(item => !viewTimestamps[item.id]);
  
  // Sort visited by most recent view time
  visitedBooks.sort((a, b) => {
    const aViewTime = viewTimestamps[a.id] || 0;
    const bViewTime = viewTimestamps[b.id] || 0;
    return bViewTime - aViewTime;
  });
  
  // Sort unvisited by publish_date (newest first)
  unvisitedBooks.sort((a, b) => 
    new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
  );
  
  // Combine in order: active daily -> favorites -> visited -> unvisited
  const allBooks = [
    ...(activeDailyBook ? [activeDailyBook] : []),
    ...sortedFavorites,
    ...visitedBooks,
    ...unvisitedBooks
  ];

  return (
    <>
      <MetaHead metadata={{
        title: "Library - Daily ABC Illustrations",
        description: "Explore all queued, active, and past ABC illustration books.",
        type: "website"
      }} />
      
      <StandardPageLayout containerClassName="pb-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">ABC Books Library</h1>
              <p className="text-muted-foreground">
                Explore all published daily ABC illustration books
              </p>
            </div>
          </div>

          {/* All Books */}
          {allBooks.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {allBooks.map((item, index) => (
                <LibraryBookCard 
                  key={item.id} 
                  item={item} 
                  index={index}
                  isNewlyPublished={item.id === activeDailyPublished?.id}
                  isFavorited={favoriteIds.has(item.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}

          {allBooks.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No books in library</h3>
                <p className="text-muted-foreground">
                  Check back soon for new daily illustrations!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </StandardPageLayout>
    </>
  );
});

interface LibraryBookCardProps {
  item: DailyPublishedWithBook;
  index: number;
  isNewlyPublished?: boolean;
  isFavorited?: boolean;
  onToggleFavorite: (dailyPublishedId: string) => void;
}

const LibraryBookCard = memo(function LibraryBookCard({ 
  item, 
  index, 
  isNewlyPublished, 
  isFavorited = false,
  onToggleFavorite 
}: LibraryBookCardProps) {
  const navigate = useNavigate();
  const { hasLibraryAccess } = useFeatureAccess();
  
  const handleCardClick = () => {
    // Only allow navigation if user has library access (active subscription)
    if (!hasLibraryAccess) {
      return; // Blocked by premium overlay
    }
    
    // Track the book view for sorting
    trackBookView(item.id);
    
    // Navigate to detail page to choose starting page
    navigate(`/library/${item.id}/detail`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onToggleFavorite(item.id);
  };

  // Show premium overlay if user doesn't have library access
  const shouldShowPremiumOverlay = !hasLibraryAccess;

  return (
    <PremiumContentWrapper showOverlay={shouldShowPremiumOverlay}>
      <Card 
        className={`hover:shadow-md transition-shadow ${shouldShowPremiumOverlay ? '' : 'cursor-pointer hover:shadow-lg'} relative`}
        onClick={handleCardClick}
      >
        {/* Favorite Heart Button - only functional if not locked */}
        {!shouldShowPremiumOverlay && (
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
        )}

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
          
          <div className="aspect-video rounded-lg flex items-center justify-center overflow-hidden">
            {item.og_image_url ? (
              <BookImage
                src={item.og_image_url}
                alt={`Preview of ${item.seo_title || item.title}`}
                priority={index < 6}
                className="w-full h-full object-cover object-center"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>
    </PremiumContentWrapper>
  );
});