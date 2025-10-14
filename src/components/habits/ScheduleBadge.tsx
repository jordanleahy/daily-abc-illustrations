import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleBadgeProps {
  isScheduled: boolean;
  onClick: () => void;
  date?: Date;
  onAddToday?: () => void;
  isAddedToday?: boolean;
}

export function ScheduleBadge({ 
  isScheduled, 
  onClick, 
  date = addDays(new Date(), 1),
  onAddToday,
  isAddedToday 
}: ScheduleBadgeProps) {
  const formattedDate = format(date, 'M/d');
  
  return (
    <div className="w-full space-y-2">
      {onAddToday && (
        <Button
          variant={isAddedToday ? "default" : "default"}
          className={cn(
            "w-full",
            isAddedToday && "bg-green-500 hover:bg-green-600"
          )}
          onClick={onAddToday}
          disabled={isAddedToday}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isAddedToday ? 'Added to Today ✓' : 'Add Today'}
        </Button>
      )}
      
      <Button
        variant={isScheduled ? "default" : "outline"}
        className={cn(
          "w-full",
          isScheduled && "bg-green-500 hover:bg-green-600 border-green-500"
        )}
        onClick={onClick}
      >
        <Calendar className="h-4 w-4 mr-2" />
        {isScheduled ? `Scheduled ${formattedDate}` : 'Schedule for Tomorrow'}
      </Button>
    </div>
  );
}
