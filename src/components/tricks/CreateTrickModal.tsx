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
import { ImageUpload } from '@/components/ImageUpload';
import { uploadTrickPhoto } from '@/utils/trickPhotoUpload';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

const FEATURE_ANGLES = [
  'Flat',
  'Down',
  'Up',
  'Down Flat Down',
  'Up Down',
  'Flat, Down, Flat Down',
  'Down Flat Down Rail',
];

const TYPES = [
  'Box',
  'Flat Rail',
  'Round Rail',
  'Log',
];

interface CreateTrickModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTrickModal({ open, onOpenChange }: CreateTrickModalProps) {
  const { data: kids } = useKidProfiles();
  const createTrick = useCreateTrick();
  const { user } = useAuthContext();

  const [name, setName] = useState('');
  const [featureAngle, setFeatureAngle] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [pointsPerCompletion, setPointsPerCompletion] = useState(1);
  const [selectedKids, setSelectedKids] = useState<Record<string, { selected: boolean; targetCount: number }>>({});
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [featureAngleOpen, setFeatureAngleOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [customFeatureAngle, setCustomFeatureAngle] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const assignedKids = Object.entries(selectedKids)
      .filter(([_, value]) => value.selected)
      .map(([kidId, value]) => ({
        kid_profile_id: kidId,
        target_count: value.targetCount,
      }));

    if (assignedKids.length === 0) {
      toast.error('Please assign at least one kid');
      return;
    }

    try {
      setIsUploading(true);
      let photoUrl: string | undefined;

      // Upload photo if one was selected
      if (photoFile && user) {
        photoUrl = await uploadTrickPhoto(photoFile, user.id);
      }

      createTrick.mutate(
        {
          name,
          description: `${featureAngle ? `Feature Angle: ${featureAngle}\n` : ''}${type ? `Type: ${type}\n` : ''}${description}`,
          points_per_completion: pointsPerCompletion,
          photo_url: photoUrl,
          assigned_kids: assignedKids,
        },
        {
          onSuccess: () => {
            setName('');
            setFeatureAngle('');
            setType('');
            setDescription('');
            setPointsPerCompletion(1);
            setSelectedKids({});
            setComboboxOpen(false);
            setFeatureAngleOpen(false);
            setTypeOpen(false);
            setCustomFeatureAngle('');
            setPhotoFile(null);
            onOpenChange(false);
          },
          onSettled: () => {
            setIsUploading(false);
          },
        }
      );
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to upload photo');
      setIsUploading(false);
    }
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
            <Label htmlFor="featureAngle">Feature Angle</Label>
            <Popover open={featureAngleOpen} onOpenChange={setFeatureAngleOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={featureAngleOpen}
                  className="w-full justify-between"
                >
                  {featureAngle || "Select feature angle..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 pointer-events-auto" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search or type custom..." 
                    value={customFeatureAngle}
                    onValueChange={setCustomFeatureAngle}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          if (customFeatureAngle.trim()) {
                            setFeatureAngle(customFeatureAngle.trim());
                            setFeatureAngleOpen(false);
                            setCustomFeatureAngle('');
                          }
                        }}
                      >
                        Add "{customFeatureAngle}"
                      </Button>
                    </CommandEmpty>
                    <CommandGroup>
                      {FEATURE_ANGLES.map((angle) => (
                        <CommandItem
                          key={angle}
                          value={angle}
                          onSelect={(currentValue) => {
                            setFeatureAngle(currentValue === featureAngle ? '' : currentValue);
                            setFeatureAngleOpen(false);
                            setCustomFeatureAngle('');
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              featureAngle === angle ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {angle}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Popover open={typeOpen} onOpenChange={setTypeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={typeOpen}
                  className="w-full justify-between"
                >
                  {type || "Select type..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 pointer-events-auto" align="start">
                <Command>
                  <CommandInput placeholder="Search type..." />
                  <CommandList>
                    <CommandEmpty>No type found.</CommandEmpty>
                    <CommandGroup>
                      {TYPES.map((t) => (
                        <CommandItem
                          key={t}
                          value={t}
                          onSelect={(currentValue) => {
                            setType(currentValue === type ? '' : currentValue);
                            setTypeOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              type === t ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {t}
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

          <div>
            <Label>Trick Photo (Optional)</Label>
            <ImageUpload
              onImageSelect={setPhotoFile}
              disabled={isUploading}
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
            <Button type="submit" disabled={createTrick.isPending || isUploading}>
              {isUploading ? 'Uploading...' : createTrick.isPending ? 'Creating...' : 'Create Trick'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
