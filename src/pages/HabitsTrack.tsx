import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { HabitTrackingCard } from '@/components/habits';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { LoadingState } from '@/components/ui/loading-state';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function HabitsTrack() {
  const { data: completions = [], isLoading } = useTodayHabits();

  // Group completions by kid
  const completionsByKid = completions.reduce((acc, completion) => {
    const kid = completion.habit_assignments.kid_profiles;
    const kidKey = `${kid.first_name} ${kid.last_name}`;
    if (!acc[kidKey]) {
      acc[kidKey] = {
        kid,
        completions: [],
      };
    }
    acc[kidKey].completions.push(completion);
    return acc;
  }, {} as Record<string, { kid: any; completions: typeof completions }>);

  return (
    <StandardPageLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Track Today's Habits</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          
          <Button asChild variant="outline">
            <Link to="/habits/manage">Manage Habits</Link>
          </Button>
        </div>

        {isLoading ? (
          <LoadingState text="Loading today's habits..." />
        ) : completions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No habits scheduled for today. Create habits in the Manage Habits page to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(completionsByKid).map(([kidName, { kid, completions }]) => (
              <div key={kidName} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold">{kidName}</h2>
                  <Badge variant="secondary">
                    {kid.earned_coins} coins
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completions.map((completion) => (
                    <HabitTrackingCard
                      key={completion.id}
                      completion={completion}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}
