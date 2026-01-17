import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, List } from 'lucide-react';
import { toast } from 'sonner';

interface GradeLevel {
  id: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface GradeLevelFormData {
  id: string;
  label: string;
  description: string;
  is_active: boolean;
}

const defaultFormData: GradeLevelFormData = {
  id: '',
  label: '',
  description: '',
  is_active: true,
};

interface GradeLevelOptionManagerProps {
  questionId: string;
}

export function GradeLevelOptionManager({ questionId }: GradeLevelOptionManagerProps) {
  const queryClient = useQueryClient();
  
  const { data: gradeLevels, isLoading } = useQuery({
    queryKey: ['grade_levels', 'all'],
    queryFn: async (): Promise<GradeLevel[]> => {
      const { data, error } = await supabase
        .from('grade_levels')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<GradeLevel, 'sort_order'> & { sort_order?: number }) => {
      const { error } = await supabase.from('grade_levels').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade_levels'] });
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      toast.success('Grade level created');
    },
    onError: (error) => {
      toast.error('Failed to create grade level');
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<GradeLevel> & { id: string }) => {
      const { error } = await supabase.from('grade_levels').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade_levels'] });
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      toast.success('Grade level updated');
    },
    onError: (error) => {
      toast.error('Failed to update grade level');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('grade_levels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade_levels'] });
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      toast.success('Grade level deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete grade level');
      console.error(error);
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<GradeLevelFormData>(defaultFormData);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (gradeLevel: GradeLevel) => {
    setEditingId(gradeLevel.id);
    setFormData({
      id: gradeLevel.id,
      label: gradeLevel.label,
      description: gradeLevel.description || '',
      is_active: gradeLevel.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    const nextSortOrder = gradeLevels ? Math.max(...gradeLevels.map(g => g.sort_order), 0) + 1 : 1;
    
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        label: formData.label,
        description: formData.description || null,
        is_active: formData.is_active,
      });
    } else {
      createMutation.mutate({
        id: formData.id,
        label: formData.label,
        description: formData.description || null,
        is_active: formData.is_active,
        sort_order: nextSortOrder,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
    setIsDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleToggleActive = (gradeLevel: GradeLevel) => {
    updateMutation.mutate({
      id: gradeLevel.id,
      is_active: !gradeLevel.is_active,
    });
  };

  const handleLabelChange = (value: string) => {
    const newData = { ...formData, label: value };
    if (!editingId) {
      newData.id = value.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    }
    setFormData(newData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <List className="h-5 w-5 text-primary" />
          Grade Level Options ({gradeLevels?.length || 0})
        </CardTitle>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Grade Level
        </Button>
      </CardHeader>
      <CardContent>
        {gradeLevels && gradeLevels.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {gradeLevels.map((gradeLevel) => (
              <div 
                key={gradeLevel.id}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group ${!gradeLevel.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{gradeLevel.label}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{gradeLevel.id}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Switch
                    checked={gradeLevel.is_active}
                    onCheckedChange={() => handleToggleActive(gradeLevel)}
                    disabled={updateMutation.isPending}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenEdit(gradeLevel)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleOpenDelete(gradeLevel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No grade levels available.</p>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Grade Level' : 'Add Grade Level'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Display Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="e.g., Kindergarten"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="id">ID</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingId}
                  placeholder="e.g., K"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Ages 5-6"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending || !formData.id || !formData.label}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Grade Level</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this grade level? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
