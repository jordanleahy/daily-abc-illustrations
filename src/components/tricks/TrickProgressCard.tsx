import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { TrickGoalWithDetails } from '@/types/trick';
import { useAddTrickCompletion } from '@/hooks/useAddTrickCompletion';

interface TrickProgressCardProps {
  goal: TrickGoalWithDetails;
}

export function TrickProgressCard({ goal }: TrickProgressCardProps) {
  const addCompletion = useAddTrickCompletion();
  const [customCount, setCustomCount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const progress = Math.round((goal.current_count / goal.target_count) * 100);
  const isCompleted = !!goal.goal_completed_at;

  const handleQuickAdd = (count: number) => {
    addCompletion.mutate(
      {
        goalId: goal.id,
        count_increment: count,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setNotes('');
          setCustomCount('');
        },
      }
    );
  };

  const handleCustomAdd = () => {
    if (customCount && customCount > 0) {
      handleQuickAdd(Number(customCount));
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">{goal.tricks?.name}</h3>
          {goal.tricks?.description && (
            <p className="text-sm text-muted-foreground mt-1">{goal.tricks.description}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">
              {goal.current_count}/{goal.target_count} ({progress}%)
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {isCompleted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-semibold">🎉 Goal Completed!</p>
            <p className="text-sm text-green-600 mt-1">
              You mastered this trick!
            </p>
          </div>
        ) : (
          <>
            <div>
              <Label className="text-base">How many did you do?</Label>
              <div className="flex gap-2 mt-2">
                <Button onClick={() => handleQuickAdd(1)} variant="outline" className="flex-1">
                  +1
                </Button>
                <Button onClick={() => handleQuickAdd(5)} variant="outline" className="flex-1">
                  +5
                </Button>
                <Button onClick={() => handleQuickAdd(10)} variant="outline" className="flex-1">
                  +10
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Custom"
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value ? Number(e.target.value) : '')}
                  className="flex-1"
                />
                <Button onClick={handleCustomAdd} disabled={!customCount || customCount <= 0}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor={`notes-${goal.id}`}>Notes (optional)</Label>
              <Textarea
                id={`notes-${goal.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Great form today!"
                rows={2}
                className="mt-1"
              />
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Earn {goal.tricks?.points_per_completion} {goal.tricks?.points_per_completion === 1 ? 'coin' : 'coins'} per completion
        </p>
      </div>
    </Card>
  );
}
