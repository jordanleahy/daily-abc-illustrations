import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, List } from 'lucide-react';
import { toast } from 'sonner';
import type { StaticOption } from '@/hooks/useQuestions';

interface StaticOptionFormData {
  value: string;
  label: string;
}

const defaultFormData: StaticOptionFormData = {
  value: '',
  label: '',
};

interface StaticOptionManagerProps {
  questionId: string;
  options: StaticOption[];
}

export function StaticOptionManager({ questionId, options }: StaticOptionManagerProps) {
  const queryClient = useQueryClient();
  
  const updateMutation = useMutation({
    mutationFn: async (newOptions: StaticOption[]) => {
      const { error } = await supabase
        .from('questions')
        .update({ static_options: newOptions as unknown as Json })
        .eq('id', questionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question', questionId] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: (error) => {
      toast.error('Failed to update options');
      console.error(error);
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<StaticOptionFormData>(defaultFormData);

  const handleOpenCreate = () => {
    setEditingIndex(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index);
    setFormData({
      value: options[index].value,
      label: options[index].label,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (index: number) => {
    setDeleteIndex(index);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    const newOption: StaticOption = {
      value: formData.value,
      label: formData.label,
    };

    let newOptions: StaticOption[];
    if (editingIndex !== null) {
      newOptions = [...options];
      newOptions[editingIndex] = newOption;
      toast.success('Option updated');
    } else {
      newOptions = [...options, newOption];
      toast.success('Option added');
    }

    updateMutation.mutate(newOptions);
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteIndex !== null) {
      const newOptions = options.filter((_, i) => i !== deleteIndex);
      updateMutation.mutate(newOptions);
      toast.success('Option deleted');
    }
    setIsDeleteDialogOpen(false);
    setDeleteIndex(null);
  };

  const handleLabelChange = (value: string) => {
    const newData = { ...formData, label: value };
    if (editingIndex === null) {
      newData.value = value.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    }
    setFormData(newData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <List className="h-5 w-5 text-primary" />
          Static Options ({options.length})
        </CardTitle>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Option
        </Button>
      </CardHeader>
      <CardContent>
        {options.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {options.map((option, index) => (
              <div 
                key={option.value}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{option.label}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{option.value}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenEdit(index)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleOpenDelete(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No static options defined.</p>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIndex !== null ? 'Edit Option' : 'Add Option'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Display Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="e.g., Winter"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  disabled={editingIndex !== null}
                  placeholder="e.g., WINTER"
                />
                <p className="text-xs text-muted-foreground">Auto-generated from label</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending || !formData.value || !formData.label}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingIndex !== null ? 'Save Changes' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Option</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this option? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
