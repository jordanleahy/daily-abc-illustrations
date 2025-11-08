import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { HabitTrackingCard, HabitCarousel } from '@/components/habits';
import { BookCarousel } from '@/components/landing/BookCarousel';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { useKidSelection } from '@/contexts/KidSelectionContext';
import { useKidRecentlyRead } from '@/hooks/useKidRecentlyRead';
import { LoadingState } from '@/components/ui/loading-state';
import { format } from 'date-fns';
import { CoinCounter } from '@/components/ui/coin-counter';
import { getTimeBasedGreeting } from '@/utils/timeUtils';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  
  // Get selected kid from context
  const { selectedKid, isLoading: isLoadingKids } = useKidSelection();
  
  // Fetch today's habits for the selected kid
  const { data: completions = [], isLoading: isLoadingHabits } = useTodayHabits(selectedKid?.id);
  
  // Fetch recently read books for the selected kid
  const { data: recentlyReadBooks = [], isLoading: isLoadingBooks } = useKidRecentlyRead(selectedKid?.id);
  
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

  if (!selectedKid) {
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
              Good {timeOfDay}, {selectedKid.first_name}!
            </h1>
            <CoinCounter coins={selectedKid.earned_coins} size="md" />
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

        {/* Recently Read Books */}
        {recentlyReadBooks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Recently Read</h2>
            <BookCarousel books={recentlyReadBooks} />
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
};

export default Index;
