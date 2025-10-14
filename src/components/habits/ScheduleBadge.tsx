import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduleBadgeProps {
  isScheduled: boolean;
  onClick: () => void;
  date?: Date;
}

export function ScheduleBadge({ isScheduled, onClick, date = addDays(new Date(), 1) }: ScheduleBadgeProps) {
  const formattedDate = format(date, 'M/d');
  
  return (
    <Button
      variant={isScheduled ? "default" : "outline"}
      className={cn(
        "w-full mt-3",
        isScheduled && "bg-green-500 hover:bg-green-600 border-green-500"
      )}
      onClick={onClick}
    >
      <Calendar className="h-4 w-4 mr-2" />
      {isScheduled ? `Scheduled ${formattedDate}` : 'Schedule for Tomorrow'}
    </Button>
  );
}
