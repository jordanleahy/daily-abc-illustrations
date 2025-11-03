import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateHabit } from '@/hooks/useCreateHabit';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { HabitFrequency } from '@/types/habit';
import { Loader2, X } from 'lucide-react';
import { ModalProps } from '@/types/shared';

interface CreateHabitModalProps extends ModalProps {}

export function CreateHabitModal({ open, onOpenChange }: CreateHabitModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [coinAmount, setCoinAmount] = useState('10');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [selectedKids, setSelectedKids] = useState<string[]>([]);

  const { data: kids = [] } = useKidProfiles();
  const createHabit = useCreateHabit();

  // Auto-select first kid when kids load
  useEffect(() => {
    if (kids.length > 0 && selectedKids.length === 0) {
      setSelectedKids([kids[0].id]);
    }
  }, [kids, selectedKids.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !coinAmount || selectedKids.length === 0) {
      return;
    }

    await createHabit.mutateAsync({
      title,
      description: description || undefined,
      photo_url: photoUrl || undefined,
      coin_amount: parseInt(coinAmount),
      frequency,
      deadline_time: deadlineTime || undefined,
      assignedKidIds: selectedKids,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setPhotoUrl('');
    setCoinAmount('10');
    setFrequency('daily');
    setDeadlineTime('');
    setSelectedKids([]);
    onOpenChange(false);
  };

  const toggleKid = (kidId: string) => {
    setSelectedKids(prev => 
      prev.includes(kidId) 
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
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
            <Label htmlFor="frequency">Frequency *</Label>
            <Select value={frequency} onValueChange={(value) => setFrequency(value as HabitFrequency)}>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="space-y-2">
            <Label>Assign to Kids *</Label>
            {kids.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No kid profiles found. Please create a kid profile first.
              </p>
            ) : (
              <div className="space-y-2">
                {kids.map((kid) => (
                  <div key={kid.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`kid-${kid.id}`}
                      checked={selectedKids.includes(kid.id)}
                      onCheckedChange={() => toggleKid(kid.id)}
                    />
                    <label
                      htmlFor={`kid-${kid.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {kid.first_name} {kid.last_name}
                    </label>
                  </div>
                ))}
              </div>
            )}
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
              disabled={createHabit.isPending || !title || !coinAmount || selectedKids.length === 0}
            >
              {createHabit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Habit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
