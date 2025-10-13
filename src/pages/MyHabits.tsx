import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CoinCounter } from '@/components/ui/coin-counter';
import { useMyHabits } from '@/hooks/useMyHabits';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useDeleteHabit } from '@/hooks/useDeleteHabit';
import { LoadingState } from '@/components/ui/loading-state';
import { Coins, Trash2 } from 'lucide-react';

export default function MyHabits() {
  const { data: kids = [] } = useKidProfiles();
  const deleteHabit = useDeleteHabit();
  
  // For now, show habits for the first kid
  // In a real app, you'd have kid selection or authentication
  const selectedKid = kids[0];
  const { data: completions = [], isLoading } = useMyHabits(selectedKid?.id || '');

  const handleDelete = (habitId: string, habitTitle: string) => {
    if (window.confirm(`Delete "${habitTitle}"? It will be removed from all days.`)) {
      deleteHabit.mutate(habitId);
    }
  };

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
          <CoinCounter coins={selectedKid.earned_coins} size="lg" />
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
            {completions.map((completion) => {
              const habit = completion.habit_assignments.habits;
              const isPending = completion.status === 'pending';
              const isCompleted = completion.status === 'completed';
              const isDeclined = completion.status === 'declined';

              return (
                <Card 
                  key={completion.id}
                  className={`relative ${
                    isCompleted ? 'border-green-500 bg-green-50/50' :
                    isDeclined ? 'border-red-500 bg-red-50/50 opacity-75' :
                    ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg flex-1">{habit.title}</CardTitle>
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
                        className={`w-full h-48 object-cover rounded ${isDeclined ? 'grayscale' : ''}`}
                      />
                    )}

                    {habit.description && (
                      <p className="text-sm text-muted-foreground">{habit.description}</p>
                    )}

                    <div className="flex items-center gap-2">
                      <Coins className={`h-6 w-6 ${
                        isCompleted ? 'text-green-600' :
                        isDeclined ? 'text-red-600' :
                        'text-amber-500'
                      }`} />
                      <span className={`text-2xl font-bold ${
                        isCompleted ? 'text-green-600' :
                        isDeclined ? 'text-red-600 line-through' :
                        ''
                      }`}>
                        {habit.coin_amount} coins
                      </span>
                    </div>

                    <Badge 
                      variant={
                        isCompleted ? 'default' :
                        isDeclined ? 'destructive' :
                        'secondary'
                      }
                      className="w-full justify-center py-2"
                    >
                      {isCompleted && '✓ Done!'}
                      {isDeclined && '✗ Not done'}
                      {isPending && '⏳ Waiting'}
                    </Badge>
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
