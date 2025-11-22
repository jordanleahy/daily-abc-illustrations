import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useCreateTrick } from '@/hooks/useCreateTrick';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateTrickModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTrickModal({ open, onOpenChange }: CreateTrickModalProps) {
  const { data: kids } = useKidProfiles();
  const createTrick = useCreateTrick();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pointsPerCompletion, setPointsPerCompletion] = useState(1);
  const [selectedKids, setSelectedKids] = useState<Record<string, { selected: boolean; targetCount: number }>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const assignedKids = Object.entries(selectedKids)
      .filter(([_, value]) => value.selected)
      .map(([kidId, value]) => ({
        kid_profile_id: kidId,
        target_count: value.targetCount,
      }));

    if (assignedKids.length === 0) {
      return;
    }

    createTrick.mutate(
      {
        name,
        description,
        points_per_completion: pointsPerCompletion,
        assigned_kids: assignedKids,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setPointsPerCompletion(1);
          setSelectedKids({});
          onOpenChange(false);
        },
      }
    );
  };

  const toggleKid = (kidId: string) => {
    setSelectedKids((prev) => ({
      ...prev,
      [kidId]: {
        selected: !prev[kidId]?.selected,
        targetCount: prev[kidId]?.targetCount || 100,
      },
    }));
  };

  const updateTargetCount = (kidId: string, count: number) => {
    setSelectedKids((prev) => ({
      ...prev,
      [kidId]: {
        ...prev[kidId],
        targetCount: count,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Trick</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Trick Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Cartwheel"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Practice perfect form"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="points">Coins per Completion</Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={pointsPerCompletion}
              onChange={(e) => setPointsPerCompletion(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Assign to Kids</Label>
            {kids?.map((kid) => (
              <div key={kid.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <Checkbox
                  checked={selectedKids[kid.id]?.selected || false}
                  onCheckedChange={() => toggleKid(kid.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{kid.first_name} {kid.last_name}</p>
                </div>
                {selectedKids[kid.id]?.selected && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Goal:</Label>
                    <Input
                      type="number"
                      min="1"
                      value={selectedKids[kid.id]?.targetCount || 100}
                      onChange={(e) => updateTargetCount(kid.id, Number(e.target.value))}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTrick.isPending}>
              {createTrick.isPending ? 'Creating...' : 'Create Trick'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
