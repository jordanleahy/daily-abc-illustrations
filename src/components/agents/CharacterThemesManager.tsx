import { useState } from 'react';
import { useCharacterThemes, useCharacterThemeMutations, CharacterTheme, CharacterThemeInsert } from '@/hooks/useCharacterThemes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ThemeFormData {
  id: string;
  display_name: string;
  thumbnail_url: string;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
  is_special: boolean;
}

const defaultFormData: ThemeFormData = {
  id: '',
  display_name: '',
  thumbnail_url: '',
  alt_text: '',
  sort_order: 0,
  is_active: true,
  is_special: false,
};

export function CharacterThemesManager() {
  const { data: themes, isLoading } = useCharacterThemes(true); // Include inactive
  const { createTheme, updateTheme, deleteTheme, isCreating, isUpdating, isDeleting } = useCharacterThemeMutations();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ThemeFormData>(defaultFormData);

  const handleOpenCreate = () => {
    setEditingId(null);
    const nextSortOrder = themes ? Math.max(...themes.map(t => t.sort_order), 0) + 1 : 1;
    setFormData({ ...defaultFormData, sort_order: nextSortOrder });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (theme: CharacterTheme) => {
    setEditingId(theme.id);
    setFormData({
      id: theme.id,
      display_name: theme.display_name,
      thumbnail_url: theme.thumbnail_url,
      alt_text: theme.alt_text,
      sort_order: theme.sort_order,
      is_active: theme.is_active,
      is_special: theme.is_special,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateTheme({
        id: editingId,
        display_name: formData.display_name,
        thumbnail_url: formData.thumbnail_url,
        alt_text: formData.alt_text,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        is_special: formData.is_special,
      });
    } else {
      createTheme(formData as CharacterThemeInsert);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteTheme(deleteId);
    }
    setIsDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleToggleActive = (theme: CharacterTheme) => {
    updateTheme({
      id: theme.id,
      is_active: !theme.is_active,
    });
  };

  // Auto-generate ID from display name
  const handleDisplayNameChange = (value: string) => {
    const newData = { ...formData, display_name: value };
    if (!editingId) {
      // Auto-generate kebab-case ID
      newData.id = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      // Auto-generate alt text
      newData.alt_text = `${value} themed book`;
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
        <CardTitle className="text-lg">Character Themes</CardTitle>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Theme
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Manage character themes used across all book creation agents. Changes apply to all agents immediately.
        </p>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Preview</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {themes?.map((theme) => (
              <TableRow key={theme.id} className={!theme.is_active ? 'opacity-50' : ''}>
                <TableCell>
                  {theme.thumbnail_url ? (
                    <img 
                      src={theme.thumbnail_url} 
                      alt={theme.alt_text}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">{theme.id}</TableCell>
                <TableCell>{theme.display_name}</TableCell>
                <TableCell>{theme.sort_order}</TableCell>
                <TableCell>
                  {theme.is_special ? (
                    <Badge variant="secondary">Special</Badge>
                  ) : (
                    <Badge variant="outline">Standard</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={theme.is_active}
                    onCheckedChange={() => handleToggleActive(theme)}
                    disabled={isUpdating}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(theme)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDelete(theme.id)}
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Character Theme' : 'Add Character Theme'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  placeholder="e.g., PAW Patrol"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="id">ID (kebab-case)</Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingId}
                  placeholder="e.g., paw-patrol"
                />
                <p className="text-xs text-muted-foreground">Auto-generated from display name</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="e.g., /themes/paw-patrol.png"
                />
                {formData.thumbnail_url && (
                  <img 
                    src={formData.thumbnail_url} 
                    alt="Preview" 
                    className="w-16 h-16 rounded object-cover mt-2"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alt_text">Alt Text</Label>
                <Input
                  id="alt_text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  placeholder="e.g., PAW Patrol themed book"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  min={0}
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_special"
                    checked={formData.is_special}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_special: checked })}
                  />
                  <Label htmlFor="is_special">Special (no image)</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isCreating || isUpdating || !formData.id || !formData.display_name}>
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
              <AlertDialogTitle>Delete Character Theme</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this character theme? This action cannot be undone.
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
