import { Habit } from '@/types/habit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, Clock, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ScheduleBadge } from './ScheduleBadge';

interface HabitCardProps {
  habit: Habit;
  onDelete?: (habitId: string) => void;
  isScheduled?: boolean;
  onScheduleToggle?: (habitId: string) => void;
}

export function HabitCard({ habit, onDelete, isScheduled, onScheduleToggle }: HabitCardProps) {
  const formatDeadlineTime = (time: string) => {
    try {
      return format(parseISO(`2000-01-01T${time}`), 'h:mm a');
    } catch {
      return time;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          {onScheduleToggle && (
            <ScheduleBadge
              isScheduled={isScheduled || false}
              onClick={() => onScheduleToggle(habit.id)}
            />
          )}
          
          <div>
            <CardTitle className="text-lg">{habit.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="capitalize">
                {habit.frequency}
              </Badge>
              {habit.deadline_time && (
                <Badge variant="default">
                  <Clock className="h-3 w-3 mr-1" />
                  Due: {formatDeadlineTime(habit.deadline_time)}
                </Badge>
              )}
            </div>
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
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">{habit.coin_amount} coins</span>
          </div>
          
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(habit.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
