import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { HabitTrackingCard, HabitCarousel } from '@/components/habits';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import { useHomeImagePreloader } from '@/hooks/useHomeImagePreloader';
import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch';
import { LoadingState } from '@/components/ui/loading-state';
import { format, formatDistanceToNow } from 'date-fns';
import { CoinCounter } from '@/components/ui/coin-counter';
import { getTimeBasedGreeting } from '@/utils/timeUtils';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookImage } from '@/components/ui/book-image';
import { BookOpen } from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuthContext();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  
  // Redirect free users to library
  useEffect(() => {
    if (isAuthenticated && !subscriptionLoading && !hasActiveSubscription) {
      navigate('/library', { replace: true });
    }
  }, [isAuthenticated, hasActiveSubscription, subscriptionLoading, navigate]);
  
  // Get the first kid profile
  const { data: kidProfiles = [], isLoading: isLoadingKids } = useKidProfiles();
  const firstKid = kidProfiles[0];
  
  // Fetch today's habits for the first kid
  const { data: completions = [], isLoading: isLoadingHabits } = useTodayHabits(firstKid?.id);
  
  // Fetch library books with reduced staleTime for real-time updates
  const { data: libraryItems = [], isLoading: isLoadingBooks } = useLibraryBooks();
  
  // Preload book images for instant display on return visits
  useHomeImagePreloader(libraryItems);
  
  // 🚀 Predictive prefetching: Anticipate which books user will view next
  // Prefetches the top 3 most likely books based on favorites and viewing history
  const { predictedBooks } = usePredictivePrefetch();
  
  // Filter out skipped habits and sort by status (pending first, completed/failed last)
  const activeCompletions = completions
    .filter(c => c.status !== 'skipped')
    .sort((a, b) => {
      // Define status priority (lower number = higher priority)
      const statusPriority = {
        pending: 1,
        completed: 2,
        declined: 2
      };
      
      const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 3;
      const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 3;
      
      // Sort by status priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same status, maintain creation order
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  
  // Get recently viewed books (books with activity, already sorted by most recent)
  const recentBooks = libraryItems
    .filter(book => book.last_viewed_at) // Only books that have been viewed
    .slice(0, 10); // Take top 10 most recently viewed
  
  const isLoading = isLoadingKids || isLoadingHabits;
  const timeOfDay = getTimeBasedGreeting();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <StandardPageLayout>
        <div className="container mx-auto py-8">
          <LoadingState text="Loading your habits..." />
        </div>
      </StandardPageLayout>
    );
  }

  if (!firstKid) {
    return (
      <StandardPageLayout>
        <div className="container mx-auto py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No kid profiles found. Please create a kid profile first.
            </p>
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Child-focused header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-4xl font-bold">
              Good {timeOfDay}, {firstKid.first_name}!
            </h1>
            <CoinCounter coins={firstKid.earned_coins} size="md" />
          </div>
          <p className="text-xl text-muted-foreground">
            Today is {format(new Date(), 'EEEE, MMMM do')}
          </p>
          <p className="text-lg text-muted-foreground">
            Here is your {timeOfDay} to-do list
          </p>
        </div>

        {/* Habits list */}
        {activeCompletions.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg space-y-2">
            <p className="text-lg text-muted-foreground">
              No habits scheduled for today! 
            </p>
            <p className="text-sm text-muted-foreground">
              Ask your parent to schedule habits from the Manage Habits page.
            </p>
          </div>
        ) : isMobile ? (
          <HabitCarousel completions={activeCompletions} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCompletions.map((completion) => (
              <HabitTrackingCard
                key={completion.id}
                completion={completion}
              />
            ))}
          </div>
        )}

        {/* Recently Viewed Books */}
        {recentBooks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Recently Viewed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentBooks.map((book) => (
                <Card 
                  key={book.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/library/${book.id}/detail`)}
                >
                  <div className="aspect-square rounded-t-lg flex items-center justify-center overflow-hidden">
                    {book.og_image_url ? (
                      <BookImage
                        src={book.og_image_url}
                        alt={book.seo_title || book.title}
                        className="w-full h-full object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{book.seo_title || book.title}</CardTitle>
                    {book.last_viewed_at && (
                      <CardDescription className="text-xs">
                        {formatDistanceToNow(new Date(book.last_viewed_at), { addSuffix: true })}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
};

export default Index;
