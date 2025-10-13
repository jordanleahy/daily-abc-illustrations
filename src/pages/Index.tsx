import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { HabitTrackingCard } from '@/components/habits';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { LoadingState } from '@/components/ui/loading-state';
import { format } from 'date-fns';
import { CoinCounter } from '@/components/ui/coin-counter';
import { getTimeBasedGreeting } from '@/utils/timeUtils';

const Index = () => {
  // Get the first kid profile
  const { data: kidProfiles = [], isLoading: isLoadingKids } = useKidProfiles();
  const firstKid = kidProfiles[0];
  
  // Fetch today's habits for the first kid
  const { data: completions = [], isLoading: isLoadingHabits } = useTodayHabits(firstKid?.id);
  
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
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-lg text-muted-foreground">
              No habits for today! Enjoy your free time! 🎉
            </p>
          </div>
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
      </div>
    </StandardPageLayout>
  );
};

export default Index;
