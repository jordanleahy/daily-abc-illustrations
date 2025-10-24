import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface InsertPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (title: string, description: string) => Promise<void>;
  position: 'before' | 'after';
  referencePage: string; // page title for context
  isPending?: boolean;
}

export function InsertPageDialog({ 
  open, 
  onOpenChange, 
  onInsert, 
  position, 
  referencePage,
  isPending 
}: InsertPageDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleInsert = async () => {
    if (!title.trim()) return;
    await onInsert(title.trim(), description.trim());
    setTitle('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Insert Page {position === 'before' ? 'Before' : 'After'} "{referencePage}"
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Page Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., I see a dog"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context or notes..."
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!title.trim() || isPending}>
            {isPending ? 'Inserting...' : 'Insert Page'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
