import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { HabitTrackingCard } from '@/components/habits';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { LoadingState } from '@/components/ui/loading-state';
import { format } from 'date-fns';
import { CoinCounter } from '@/components/ui/coin-counter';
import { getTimeBasedGreeting } from '@/utils/timeUtils';
import { useTestHabitCreation } from '@/hooks/useTestHabitCreation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  // Get the first kid profile
  const { data: kidProfiles = [], isLoading: isLoadingKids } = useKidProfiles();
  const firstKid = kidProfiles[0];
  
  // Fetch today's habits for the first kid
  const { data: completions = [], isLoading: isLoadingHabits } = useTodayHabits(firstKid?.id);
  
  // Filter out skipped habits
  const activeCompletions = completions.filter(c => c.status !== 'skipped');
  
  // Test habit creation hook
  const { testCreateHabits, isPending: isCreatingHabits } = useTestHabitCreation();
  
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
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => testCreateHabits()}
                disabled={isCreatingHabits}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isCreatingHabits && "animate-spin")} />
                {isCreatingHabits ? "Creating..." : "Test: Create Today's Habits"}
              </Button>
              <CoinCounter coins={firstKid.earned_coins} size="md" />
            </div>
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
