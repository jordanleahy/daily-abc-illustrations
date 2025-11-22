import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useCreateTrick } from '@/hooks/useCreateTrick';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRICK_NAMES = [
  '50-50',
  'Frontside 50-50',
  'Frontside 50-50 - BS 180 Out',
  'Frontside 50-50 - BS 360 Out',
  'Frontside 50-50 - FS 180 Out',
  'Frontside 50-50 - FS 360 Out',
  'Backside 50-50',
  'Backside 50-50 - BS 180 Out',
  'Backside 50-50 - BS 360 Out',
  'Backside 50-50 - FS 180 Out',
  'Backside 50-50 - FS 360 Out',
  'Frontside Nose Press',
  'Frontside Nose Press - BS 180 OUT',
  'Frontside Nose Press - FS 180 OUT',
  'Backside Nose Press',
  'Backside Nose Press  BS 180 OUT',
  'Backside Nose Press  FS 180 OUT',
  'Frontside Tail Press',
  'Frontside Tail Press  BS 180 OUT',
  'Frontside Tail Press   FS 180 OUT',
  'Backside Tail Press',
  'Backside Tail Press BS 180 OUT',
  'Backside Tail Press FS 180 OUT',
  'Front Board',
  'Front Board - Pretzel Out',
  'Front Board - Fakie Out',
  'Boardslide',
  'Boardslide - Fake out',
  'Front Lip',
  'Front Lip - Prezel out',
  'Front Lip - Revert Out',
  'Back Lip',
  'Back Lip - Prezel out',
  'Back Lip -  Revert Out',
  'Frontside Noseslide',
  'Frontside Noseslide -  Pretzel Out',
  'Backside Noseslide',
  'Backside Noseslide -  Pretzel Out',
  'Frontside Tailpress',
  'Frontside Tailpress - BS 180 Out',
  'Frontside Tailpress - FS 180 Out',
  'Backside Tailpress',
  'Backside Tailpress - BS 180 Out',
  'Backside Tailpress - FS 180 Out',
  'Front Blunt',
  'Back Blunt',
];

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
  const [comboboxOpen, setComboboxOpen] = useState(false);

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
          setComboboxOpen(false);
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
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                >
                  {name || "Select trick..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 pointer-events-auto" align="start">
                <Command>
                  <CommandInput placeholder="Search tricks..." />
                  <CommandList>
                    <CommandEmpty>No trick found.</CommandEmpty>
                    <CommandGroup>
                      {TRICK_NAMES.map((trick) => (
                        <CommandItem
                          key={trick}
                          value={trick}
                          onSelect={(currentValue) => {
                            setName(currentValue === name ? '' : currentValue);
                            setComboboxOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              name === trick ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {trick}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
