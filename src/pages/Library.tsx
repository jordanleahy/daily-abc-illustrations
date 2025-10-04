import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import { useLibraryImagePreloader } from '@/hooks/useLibraryImagePreloader';
import { MetaHead } from '@/components/common/MetaHead';
import { StandardPageLayout } from '@/components/layout';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { BookOpen, Calendar, Users } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useIsTeacher } from '@/contexts/RoleContext';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { useAuthContext } from '@/contexts/AuthContext';

export default memo(function Library() {
  const {
    data: libraryItems,
    isLoading,
    error
  } = useLibraryBooks();
  
  // Preload book images for instant display
  useLibraryImagePreloader(libraryItems);
  

  if (isLoading) {
    return (
      <StandardPageLayout title="Library">
        <LoadingState text="Loading library..." />
      </StandardPageLayout>
    );
  }

  if (error) {
    return (
      <StandardPageLayout title="Library">
        <div className="text-center py-8">
          <p className="text-destructive">Error loading library: {error.message}</p>
        </div>
      </StandardPageLayout>
    );
  }

  // Sort all books by publish_date (newest first)
  const allBooks = libraryItems?.sort((a, b) => 
    new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
  ) || [];

  return (
    <>
      <MetaHead metadata={{
        title: "Library - Daily ABC Illustrations",
        description: "Explore all queued, active, and past ABC illustration books.",
        type: "website"
      }} />
      
      <StandardPageLayout title="Library" containerClassName="pb-8">
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
              {allBooks.map((item) => (
                <LibraryBookCard key={item.id} item={item} />
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
}

const LibraryBookCard = memo(function LibraryBookCard({ item }: LibraryBookCardProps) {
  const navigate = useNavigate();
  const isTeacher = useIsTeacher();
  const { isAuthenticated } = useAuthContext();
  const { hasActiveSubscription, createCheckoutSession } = useSubscription();
  
  const handleCardClick = async () => {
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
        <CardTitle className="text-xl line-clamp-2">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.description && (
          <CardDescription className="line-clamp-3">
            {item.description}
          </CardDescription>
        )}
        
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
              src={item.og_image_url} 
              alt={`Preview of ${item.title}`}
              className="w-full h-full object-cover object-center"
              loading="lazy"
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