import { HabitCompletionWithDetails } from '@/types/habit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Coins, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useMarkHabitComplete } from '@/hooks/useMarkHabitComplete';

interface HabitTrackingCardProps {
  completion: HabitCompletionWithDetails;
}

export function HabitTrackingCard({ completion }: HabitTrackingCardProps) {
  const markComplete = useMarkHabitComplete();
  const habit = completion.habit_assignments.habits;
  const kid = completion.habit_assignments.kid_profiles;

  const formatDeadlineTime = (time: string | null) => {
    if (!time) return null;
    try {
      return format(parseISO(`2000-01-01T${time}`), 'h:mm a');
    } catch {
      return time;
    }
  };

  const formatMarkedTime = (timestamp: string | null) => {
    if (!timestamp) return null;
    try {
      return format(parseISO(timestamp), 'h:mm a');
    } catch {
      return timestamp;
    }
  };

  const handleMarkComplete = (isComplete: boolean) => {
    markComplete.mutate({
      completionId: completion.id,
      isComplete,
      coinsAmount: completion.coins_deposited,
      kidId: completion.kid_profile_id,
    });
  };

  const isPending = completion.status === 'pending';
  const isCompleted = completion.status === 'completed';
  const isDeclined = completion.status === 'declined';

  return (
    <Card className={
      isCompleted ? 'border-green-500 bg-green-50/50' :
      isDeclined ? 'border-red-500 bg-red-50/50' :
      ''
    }>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{habit.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {kid.first_name} {kid.last_name}
            </p>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-semibold">{habit.coin_amount} coins</span>
            </div>
            
            {habit.deadline_time && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Due: {formatDeadlineTime(habit.deadline_time)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {habit.photo_url && (
          <img 
            src={habit.photo_url} 
            alt={habit.title}
            className="w-full h-32 object-cover rounded"
          />
        )}

        {habit.description && (
          <p className="text-sm text-muted-foreground">{habit.description}</p>
        )}

        {isPending ? (
          <div className="flex gap-2">
            <Button
              onClick={() => handleMarkComplete(true)}
              disabled={markComplete.isPending}
              className="flex-1"
              variant="default"
            >
              <Check className="mr-2 h-4 w-4" />
              Complete (+{habit.coin_amount})
            </Button>
            
            <Button
              onClick={() => handleMarkComplete(false)}
              disabled={markComplete.isPending}
              className="flex-1"
              variant="destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Not Done (-{habit.coin_amount})
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Badge variant={isCompleted ? 'default' : 'destructive'} className="w-full justify-center py-2">
              {isCompleted ? '✓ Completed' : '✗ Not Done'}
            </Badge>
            {completion.marked_at && (
              <p className="text-xs text-center text-muted-foreground">
                Marked at {formatMarkedTime(completion.marked_at)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
