import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleBadgeProps {
  isScheduled: boolean;
  onClick: () => void;
  date?: Date;
  onAddToday?: () => void;
  timesAddedToday?: number;
}

export function ScheduleBadge({ 
  isScheduled, 
  onClick, 
  date = addDays(new Date(), 1),
  onAddToday,
  timesAddedToday 
}: ScheduleBadgeProps) {
  const formattedDate = format(date, 'M/d');
  
  return (
    <div className="w-full space-y-2">
      {onAddToday && (
        <Button
          variant="default"
          className="w-full"
          onClick={onAddToday}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Today
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
