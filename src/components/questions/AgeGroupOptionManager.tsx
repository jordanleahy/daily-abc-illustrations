import { useState } from 'react';
import { useAgeGroups, useAgeGroupMutations, AgeGroup } from '@/hooks/useAgeGroups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, List } from 'lucide-react';

interface AgeGroupFormData {
  id: string;
  label: string;
  min_age: number;
  max_age: number;
  is_active: boolean;
}

const defaultFormData: AgeGroupFormData = {
  id: '',
  label: '',
  min_age: 0,
  max_age: 2,
  is_active: true,
};

interface AgeGroupOptionManagerProps {
  questionId: string;
}

export function AgeGroupOptionManager({ questionId }: AgeGroupOptionManagerProps) {
  const { data: ageGroups, isLoading } = useAgeGroups(true);
  const { createAgeGroup, updateAgeGroup, deleteAgeGroup, isCreating, isUpdating, isDeleting } = useAgeGroupMutations();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AgeGroupFormData>(defaultFormData);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (ageGroup: AgeGroup) => {
    setEditingId(ageGroup.id);
    setFormData({
      id: ageGroup.id,
      label: ageGroup.label,
      min_age: ageGroup.min_age,
      max_age: ageGroup.max_age,
      is_active: ageGroup.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    const nextSortOrder = ageGroups ? Math.max(...ageGroups.map(ag => ag.sort_order), 0) + 1 : 1;
    
    if (editingId) {
      updateAgeGroup({
        id: editingId,
        label: formData.label,
        min_age: formData.min_age,
        max_age: formData.max_age,
        is_active: formData.is_active,
      });
    } else {
      createAgeGroup({
        id: formData.id,
        label: formData.label,
        min_age: formData.min_age,
        max_age: formData.max_age,
        is_active: formData.is_active,
        sort_order: nextSortOrder,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteAgeGroup(deleteId);
    }
    setIsDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleToggleActive = (ageGroup: AgeGroup) => {
    updateAgeGroup({
      id: ageGroup.id,
      is_active: !ageGroup.is_active,
    });
  };

  const handleAgeChange = (field: 'min_age' | 'max_age', value: number) => {
    const newData = { ...formData, [field]: value };
    if (!editingId) {
      newData.id = `${newData.min_age}-${newData.max_age}`;
      newData.label = `${newData.min_age}-${newData.max_age} years`;
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
          Age Group Options ({ageGroups?.length || 0})
        </CardTitle>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Age Group
        </Button>
      </CardHeader>
      <CardContent>
        {ageGroups && ageGroups.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ageGroups.map((ageGroup) => (
              <div 
                key={ageGroup.id}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group ${!ageGroup.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{ageGroup.label}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{ageGroup.id}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Switch
                    checked={ageGroup.is_active}
                    onCheckedChange={() => handleToggleActive(ageGroup)}
                    disabled={isUpdating}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenEdit(ageGroup)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleOpenDelete(ageGroup.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No age groups available.</p>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Age Group' : 'Add Age Group'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_age">Min Age</Label>
                  <Input
                    id="min_age"
                    type="number"
                    min={0}
                    max={18}
                    value={formData.min_age}
                    onChange={(e) => handleAgeChange('min_age', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_age">Max Age</Label>
                  <Input
                    id="max_age"
                    type="number"
                    min={0}
                    max={18}
                    value={formData.max_age}
                    onChange={(e) => handleAgeChange('max_age', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="id">ID</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingId}
                  placeholder="e.g., 2-4"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="label">Display Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., 2-4 years"
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
              <Button onClick={handleSave} disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Age Group</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this age group? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
