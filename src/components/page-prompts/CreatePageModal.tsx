import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePage } from '@/hooks/useCreatePage';
import { ModalProps } from '@/types/shared';

interface CreatePageModalProps extends ModalProps {
  bookId: string;
  existingPages: number;
}

export function CreatePageModal({ open, onOpenChange, bookId, existingPages }: CreatePageModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const createPage = useCreatePage();

  const handleCreate = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      await createPage.mutateAsync({
        bookId,
        title: title.trim(),
        description: description.trim(),
        existingPages,
      });

      // Reset form and close modal
      setTitle('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Page</DialogTitle>
          <DialogDescription>
            Create a new page for your book. Enter a title and optional description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., A is for Apple"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this page..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={createPage.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || createPage.isPending}
          >
            {createPage.isPending ? 'Creating...' : 'Create Page'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
