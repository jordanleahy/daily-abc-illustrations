import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useUpdateSchedule } from '@/hooks/useUpdateSchedule';

interface ScheduleEditorProps {
  item: DailyPublishedWithBook;
  onCancel: () => void;
}

export function ScheduleEditor({ item, onCancel }: ScheduleEditorProps) {
  const updateSchedule = useUpdateSchedule();
  
  // Initialize with current values or defaults
  const [startDate, setStartDate] = useState<Date | undefined>(
    item.start_date ? new Date(item.start_date) : 
    item.publish_date ? new Date(item.publish_date) : new Date()
  );
  const [startTime, setStartTime] = useState(
    item.start_time || '07:01'
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    item.expire_date ? new Date(item.expire_date) : 
    item.expires_at ? new Date(item.expires_at) : 
    startDate ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) : new Date()
  );
  const [endTime, setEndTime] = useState(
    item.expire_time || '07:01'
  );

  const handleSave = async () => {
    if (!startDate || !endDate) return;
    
    await updateSchedule.mutateAsync({
      dailyPublishedId: item.id,
      start_date: format(startDate, 'yyyy-MM-dd'),
      start_time: startTime,
      expire_date: format(endDate, 'yyyy-MM-dd'),
      expire_time: endTime,
    });
    
    onCancel();
  };

  return (
    <div className="p-4 bg-muted rounded-lg space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date/Time */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">START</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'MMM d') : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-24"
            />
          </div>
        </div>

        {/* End Date/Time */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">END</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'MMM d') : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-24"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={updateSchedule.isPending}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!startDate || !endDate || updateSchedule.isPending}
        >
          {updateSchedule.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}