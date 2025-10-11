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
import { optimizeImageUrl, generateSrcSet } from '@/utils/imageOptimization';

import { BookOpen, Calendar, Users } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useIsTeacher } from '@/contexts/RoleContext';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { useAuthContext } from '@/contexts/AuthContext';
import { getBookViewTimestamps, trackBookView } from '@/utils/bookViewTracking';

export default memo(function Library() {
  const {
    data: libraryItems,
    isLoading,
    error
  } = useLibraryBooks();
  
  // Get the current active daily published book
  const { data: activeDailyPublished } = useDailyPublished();
  
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

  // Three-tier sorting: Active daily book -> Visited books -> Unvisited books
  const viewTimestamps = getBookViewTimestamps();
  
  // Find the active daily published book from library items
  const activeDailyBook = libraryItems?.find(item => item.id === activeDailyPublished?.id);
  
  // Filter out the active daily book from the rest
  const otherBooks = libraryItems?.filter(item => item.id !== activeDailyPublished?.id) || [];
  
  // Split into visited and unvisited books
  const visitedBooks = otherBooks.filter(item => viewTimestamps[item.id]);
  const unvisitedBooks = otherBooks.filter(item => !viewTimestamps[item.id]);
  
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
  
  // Combine in order: active daily book first, then visited, then unvisited
  const allBooks = [
    ...(activeDailyBook ? [activeDailyBook] : []),
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
}

const LibraryBookCard = memo(function LibraryBookCard({ item, index, isNewlyPublished }: LibraryBookCardProps) {
  const navigate = useNavigate();
  const isTeacher = useIsTeacher();
  const { isAuthenticated } = useAuthContext();
  const { hasActiveSubscription, createCheckoutSession } = useSubscription();
  
  const handleCardClick = async () => {
    // Track the book view for sorting
    trackBookView(item.id);
    
    // If user is not authenticated, redirect to pricing page
    if (!isAuthenticated) {
      navigate('/pricing');
      return;
    }
    
    // If user is authenticated but doesn't have an active subscription, redirect to Stripe
    if (isAuthenticated && !hasActiveSubscription) {
      await createCheckoutSession(SUBSCRIPTION_TIERS.standard_monthly.price_id);
      return;
    }
    
    // Otherwise, proceed with normal navigation
    if (isTeacher) {
      navigate(`/library/${item.id}/detail`);
    } else {
      navigate(`/library/${item.id}`);
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer hover:shadow-lg" 
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl line-clamp-2 flex-1">
            {item.title}
          </CardTitle>
          {isNewlyPublished && (
            <Badge variant="default" className="shrink-0">
              Newly Published
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
        
        <div className="aspect-[1200/630] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {item.og_image_url ? (
            <img 
              src={optimizeImageUrl(item.og_image_url, { width: 800, quality: 85 }) || item.og_image_url}
              srcSet={generateSrcSet(item.og_image_url, [600, 800, 1200])}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              alt={`Preview of ${item.title}`}
              className="w-full h-full object-cover object-center"
              loading={index < 6 ? "eager" : "lazy"}
              fetchPriority={index < 3 ? "high" : "auto"}
              decoding="async"
            />
          ) : (
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
});