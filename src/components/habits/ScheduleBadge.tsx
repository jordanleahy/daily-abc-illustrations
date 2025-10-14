import { Badge } from '@/components/ui/badge';
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
    <Badge
      variant={isScheduled ? "default" : "outline"}
      className={cn(
        "cursor-pointer transition-all hover:scale-105",
        isScheduled && "bg-green-500 hover:bg-green-600 border-green-500"
      )}
      onClick={onClick}
    >
      <Calendar className="h-3 w-3 mr-1" />
      For {formattedDate}
    </Badge>
  );
}
