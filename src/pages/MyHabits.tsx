import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PointsCounter } from '@/components/ui/points-counter';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useDeleteHabit } from '@/hooks/useDeleteHabit';
import { LoadingState } from '@/components/ui/loading-state';
import { Coins, Trash2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyHabits() {
  const navigate = useNavigate();
  const { data: kids = [] } = useKidProfiles();
  const deleteHabit = useDeleteHabit();
  
  // For now, show habits for the first kid
  // In a real app, you'd have kid selection or authentication
  const selectedKid = kids[0];
  const { data: completions = [], isLoading } = useTodayHabits(selectedKid?.id);

  const handleDelete = (habitId: string, habitTitle: string) => {
    if (window.confirm(`Delete "${habitTitle}"? It will be removed from all days.`)) {
      deleteHabit.mutate(habitId);
    }
  };

  // Group completions by habit to show instance counts
  const groupedByHabit = completions.reduce((acc, completion) => {
    const habitId = completion.habit_assignments.habits.id;
    if (!acc[habitId]) {
      acc[habitId] = [];
    }
    acc[habitId].push(completion);
    return acc;
  }, {} as Record<string, typeof completions>);

  if (!selectedKid) {
    return (
      <StandardPageLayout>
        <div className="container mx-auto py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No kid profile found. Please ask a parent to create a profile for you.
            </p>
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">My Habits for Today</h1>
          <PointsCounter points={selectedKid.earned_coins} size="lg" />
          <p className="text-muted-foreground">
            Complete your habits to keep your coins!
          </p>
        </div>

        {isLoading ? (
          <LoadingState text="Loading your habits..." />
        ) : completions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No habits for today. Ask your parent to create some habits for you!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedByHabit).map(([habitId, instances]) => {
              const firstInstance = instances[0];
              const habit = firstInstance.habit_assignments.habits;
              const completedCount = instances.filter(i => i.status === 'completed').length;
              const declinedCount = instances.filter(i => i.status === 'declined').length;
              const pendingCount = instances.filter(i => i.status === 'pending').length;
              const totalCount = instances.length;
              const hasMultipleInstances = totalCount > 1;

              return (
                <Card 
                  key={habitId}
                  className={`relative ${
                    completedCount === totalCount ? 'border-green-500 bg-green-50/50' :
                    declinedCount > 0 ? 'border-red-500 bg-red-50/50' :
                    ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{habit.title}</CardTitle>
                          {hasMultipleInstances && (
                            <Badge variant="secondary" className="text-xs">
                              {completedCount}/{totalCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(habit.id, habit.title)}
                        className="h-8 w-8 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {habit.photo_url && (
                      <img 
                        src={habit.photo_url} 
                        alt={habit.title}
                        className={`w-full h-48 object-cover rounded ${declinedCount > 0 ? 'grayscale' : ''}`}
                      />
                    )}

                    {habit.description && (
                      <p className="text-sm text-muted-foreground">{habit.description}</p>
                    )}

                   <div className="flex items-center gap-2">
                    <Coins className={`h-6 w-6 ${
                      completedCount === totalCount ? 'text-green-600' :
                      declinedCount > 0 ? 'text-red-600' :
                      'text-amber-500'
                    }`} />
                    <span className={`text-2xl font-bold ${
                      completedCount === totalCount ? 'text-green-600' :
                      declinedCount > 0 ? 'text-red-600' :
                      ''
                    }`}>
                      {hasMultipleInstances 
                        ? `${habit.coin_amount} × ${totalCount} = ${habit.coin_amount * totalCount}` 
                        : `${habit.coin_amount}`} coins
                    </span>
                   </div>

                   {/* Show status summary */}
                   {habit.book_id && pendingCount > 0 ? (
                    <Button
                      onClick={() => navigate(`/library/${habit.book_id}/view`)}
                      className="w-full"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Start Reading
                    </Button>
                   ) : (
                    <Badge 
                      variant={
                        completedCount === totalCount ? 'default' :
                        declinedCount > 0 ? 'destructive' :
                        'secondary'
                      }
                      className="w-full justify-center py-2"
                    >
                      {completedCount === totalCount && '✓ All Done!'}
                      {declinedCount > 0 && `✗ ${declinedCount} not done`}
                      {pendingCount > 0 && completedCount === 0 && declinedCount === 0 && `⏳ ${pendingCount} waiting`}
                      {completedCount > 0 && completedCount < totalCount && declinedCount === 0 && `${completedCount}/${totalCount} done`}
                    </Badge>
                   )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}
