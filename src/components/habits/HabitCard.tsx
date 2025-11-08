import { Habit } from '@/types/habit';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, Clock, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ScheduleBadge } from './ScheduleBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HabitCardProps {
  habit: Habit;
  onDelete?: (habitId: string) => void;
  onEdit?: (habitId: string) => void;
  isScheduled?: boolean;
  onScheduleToggle?: (habitId: string) => void;
  onAddToday?: (habitId: string) => void;
  timesAddedToday?: number;
}

export function HabitCard({ habit, onDelete, onEdit, isScheduled, onScheduleToggle, onAddToday, timesAddedToday }: HabitCardProps) {
  const formatDeadlineTime = (time: string) => {
    try {
      return format(parseISO(`2000-01-01T${time}`), 'h:mm a');
    } catch {
      return time;
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {timesAddedToday && timesAddedToday > 0 && (
                <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {timesAddedToday}
                </div>
              )}
              <CardTitle className="text-lg">{habit.title}</CardTitle>
            </div>
            {habit.deadline_time && (
              <div className="flex gap-2 mt-2">
                <Badge variant="default">
                  <Clock className="h-3 w-3 mr-1" />
                  Due: {formatDeadlineTime(habit.deadline_time)}
                </Badge>
              </div>
            )}
          </div>
          
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(habit.id)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(habit.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
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
        
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" />
          <span className="font-semibold">{habit.coin_amount} coins</span>
        </div>
      </CardContent>
      
      {onScheduleToggle && (
        <CardFooter className="pt-0">
          <ScheduleBadge
            isScheduled={isScheduled || false}
            onClick={() => onScheduleToggle(habit.id)}
            onAddToday={onAddToday ? () => onAddToday(habit.id) : undefined}
            timesAddedToday={timesAddedToday}
          />
        </CardFooter>
      )}
    </Card>
  );
}
