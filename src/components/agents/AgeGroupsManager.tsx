import { useState } from 'react';
import { useAgeGroups, useAgeGroupMutations, AgeGroup } from '@/hooks/useAgeGroups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from 'lucide-react';

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

export function AgeGroupsManager() {
  const { data: ageGroups, isLoading } = useAgeGroups(true); // Include inactive
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

  // Auto-generate ID and label from min/max age
  const handleAgeChange = (field: 'min_age' | 'max_age', value: number) => {
    const newData = { ...formData, [field]: value };
    if (!editingId) {
      // Auto-generate ID and label for new entries
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Age Groups</CardTitle>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Age Group
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Manage age ranges used across all book creation agents. Changes apply to all agents immediately.
        </p>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Range</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ageGroups?.map((ageGroup) => (
              <TableRow key={ageGroup.id} className={!ageGroup.is_active ? 'opacity-50' : ''}>
                <TableCell>
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                </TableCell>
                <TableCell className="font-mono text-sm">{ageGroup.id}</TableCell>
                <TableCell>{ageGroup.label}</TableCell>
                <TableCell>{ageGroup.min_age} - {ageGroup.max_age}</TableCell>
                <TableCell>
                  <Switch
                    checked={ageGroup.is_active}
                    onCheckedChange={() => handleToggleActive(ageGroup)}
                    disabled={isUpdating}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(ageGroup)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDelete(ageGroup.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

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
                <p className="text-xs text-muted-foreground">Auto-generated from age range</p>
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
