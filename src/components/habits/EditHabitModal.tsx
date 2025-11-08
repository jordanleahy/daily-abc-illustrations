import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUpdateHabit } from '@/hooks/useUpdateHabit';
import { Habit, HabitFrequency } from '@/types/habit';
import { Loader2, X } from 'lucide-react';
import { ModalProps } from '@/types/shared';

interface EditHabitModalProps extends ModalProps {
  habit: Habit | null;
}

export function EditHabitModal({ open, onOpenChange, habit }: EditHabitModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [coinAmount, setCoinAmount] = useState('10');
  const [frequency, setFrequency] = useState<HabitFrequency>('manual');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [isAutoSchedule, setIsAutoSchedule] = useState(false);

  const updateHabit = useUpdateHabit();

  // Populate form when habit changes
  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description || '');
      setPhotoUrl(habit.photo_url || '');
      setCoinAmount(habit.coin_amount.toString());
      setFrequency(habit.frequency);
      setDeadlineTime(habit.deadline_time || '');
      setIsAutoSchedule(habit.frequency === 'daily');
    }
  }, [habit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!habit || !title || !coinAmount) {
      return;
    }

    await updateHabit.mutateAsync({
      habitId: habit.id,
      title,
      description: description || undefined,
      photo_url: photoUrl || undefined,
      coin_amount: parseInt(coinAmount),
      frequency: isAutoSchedule ? 'daily' : 'manual',
      deadline_time: deadlineTime || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Make Bed"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about the habit"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoUrl">Photo URL</Label>
            <Input
              id="photoUrl"
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coinAmount">Coin Amount *</Label>
            <Input
              id="coinAmount"
              type="number"
              min="1"
              value={coinAmount}
              onChange={(e) => setCoinAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadlineTime">Deadline Time (Optional)</Label>
            <div className="relative">
              <Input
                id="deadlineTime"
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="pr-10"
              />
              {deadlineTime && (
                <button
                  type="button"
                  onClick={() => setDeadlineTime('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              If set, habit will automatically decline after this time
            </p>
          </div>

          {/* Auto-schedule toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex flex-col gap-1">
              <Label htmlFor="edit-auto-schedule" className="text-sm font-medium cursor-pointer">
                Auto-schedule daily
              </Label>
              <span className="text-xs text-muted-foreground">
                {isAutoSchedule 
                  ? 'Habit will appear automatically every day' 
                  : 'You will need to schedule this habit manually'}
              </span>
            </div>
            <Switch
              id="edit-auto-schedule"
              checked={isAutoSchedule}
              onCheckedChange={setIsAutoSchedule}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateHabit.isPending || !title || !coinAmount}
            >
              {updateHabit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
