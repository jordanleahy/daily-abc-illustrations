import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUpdateHabit } from '@/hooks/useUpdateHabit';
import { Habit } from '@/types/habit';
import { Loader2 } from 'lucide-react';

interface EditHabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
}

export function EditHabitModal({ open, onOpenChange, habit }: EditHabitModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [coinAmount, setCoinAmount] = useState('10');
  const [deadlineTime, setDeadlineTime] = useState('');

  const updateHabit = useUpdateHabit();

  // Populate form when habit changes
  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description || '');
      setPhotoUrl(habit.photo_url || '');
      setCoinAmount(habit.coin_amount.toString());
      setDeadlineTime(habit.deadline_time || '');
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
      frequency: 'manual',
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
            <Input
              id="deadlineTime"
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If set, habit will automatically decline after this time
            </p>
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
