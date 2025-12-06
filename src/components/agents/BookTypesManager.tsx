import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, GripVertical, Sparkles, Copy, Download, Loader2 } from 'lucide-react';
import { getIconComponent, getAvailableIconNames } from '@/utils/iconMapping';
import type { DatabaseBookType } from '@/hooks/useBookTypes';

export function BookTypesManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DatabaseBookType | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageLabel, setImageLabel] = useState('');

  const { data: bookTypes, isLoading } = useQuery({
    queryKey: ['book-types-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_types')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as DatabaseBookType[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (bookType: Partial<DatabaseBookType> & { id: string }) => {
      const { id, ...rest } = bookType;
      const { error } = await supabase
        .from('book_types')
        .upsert({
          id,
          ...rest,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-types-admin'] });
      queryClient.invalidateQueries({ queryKey: ['book-types'] });
      toast.success('Book type saved');
      setIsDialogOpen(false);
      setEditingType(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('book_types')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-types-admin'] });
      queryClient.invalidateQueries({ queryKey: ['book-types'] });
      toast.success('Status updated');
    },
  });

  const handleGenerateImage = async (bookType: DatabaseBookType) => {
    setGeneratingId(bookType.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-book-type-image', {
        body: { label: bookType.label, description: bookType.description },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedImage(data.imageUrl);
      setImageLabel(bookType.label);
      setImageDialogOpen(true);
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error(error.message || 'Failed to generate image');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCopyImage = async () => {
    if (!generatedImage) return;
    try {
      await navigator.clipboard.writeText(generatedImage);
      toast.success('Image URL copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `${imageLabel.toLowerCase().replace(/\s+/g, '-')}-icon.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openEditDialog = (bookType: DatabaseBookType) => {
    setEditingType(bookType);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingType(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading book types...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Book Types</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Book Type
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingType ? 'Edit Book Type' : 'Add Book Type'}</DialogTitle>
              </DialogHeader>
              <BookTypeForm
                initialData={editingType}
                onSave={(data) => saveMutation.mutate(data)}
                isSaving={saveMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Clarification</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookTypes?.map((bt) => {
                const Icon = getIconComponent(bt.icon_name);
                const isGenerating = generatingId === bt.id;
                return (
                  <TableRow key={bt.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${bt.color || ''}`} />
                        <code className="text-xs bg-muted px-1 rounded">{bt.id}</code>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{bt.label}</TableCell>
                    <TableCell>
                      {bt.expected_page_count ? (
                        <Badge variant="outline">{bt.expected_page_count}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {bt.needs_clarification ? (
                        <Badge variant="secondary">Yes</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={bt.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: bt.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleGenerateImage(bt)}
                          disabled={isGenerating}
                          title="Generate Image"
                        >
                          {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(bt)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generated Image: {imageLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {generatedImage && (
              <div className="flex justify-center">
                <img 
                  src={generatedImage} 
                  alt={imageLabel}
                  className="max-w-full max-h-80 rounded-lg border"
                />
              </div>
            )}
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleCopyImage}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button variant="outline" onClick={handleDownloadImage}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface BookTypeFormProps {
  initialData: DatabaseBookType | null;
  onSave: (data: Partial<DatabaseBookType> & { id: string }) => void;
  isSaving: boolean;
}

function BookTypeForm({ initialData, onSave, isSaving }: BookTypeFormProps) {
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    label: initialData?.label || '',
    description: initialData?.description || '',
    prompt: initialData?.prompt || '',
    icon_name: initialData?.icon_name || 'Package',
    color: initialData?.color || 'text-gray-500',
    expected_page_count: initialData?.expected_page_count || 12,
    needs_clarification: initialData?.needs_clarification || false,
    clarification_context: initialData?.clarification_context || '',
    sort_order: initialData?.sort_order || 0,
    is_active: initialData?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.label) {
      toast.error('ID and Label are required');
      return;
    }
    onSave(formData);
  };

  const iconNames = getAvailableIconNames();
  const SelectedIcon = getIconComponent(formData.icon_name);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="id">ID (slug)</Label>
          <Input
            id="id"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="e.g., abc, numbers"
            disabled={!!initialData}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="e.g., ABC Book"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description for users"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">Initial Prompt</Label>
        <Textarea
          id="prompt"
          value={formData.prompt}
          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
          placeholder="The prompt sent when this book type is selected"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Icon</Label>
          <Select
            value={formData.icon_name}
            onValueChange={(v) => setFormData({ ...formData, icon_name: v })}
          >
            <SelectTrigger>
              <SelectValue>
                <div className="flex items-center gap-2">
                  <SelectedIcon className="h-4 w-4" />
                  {formData.icon_name}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {iconNames.map((name) => {
                const Icon = getIconComponent(name);
                return (
                  <SelectItem key={name} value={name}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color Class</Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="text-blue-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expected_page_count">Expected Pages</Label>
          <Input
            id="expected_page_count"
            type="number"
            value={formData.expected_page_count}
            onChange={(e) => setFormData({ ...formData, expected_page_count: parseInt(e.target.value) || 12 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="needs_clarification"
            checked={formData.needs_clarification}
            onCheckedChange={(v) => setFormData({ ...formData, needs_clarification: v })}
          />
          <Label htmlFor="needs_clarification">Needs Clarification</Label>
        </div>
      </div>

      {formData.needs_clarification && (
        <div className="space-y-2">
          <Label htmlFor="clarification_context">Clarification Context</Label>
          <Textarea
            id="clarification_context"
            value={formData.clarification_context}
            onChange={(e) => setFormData({ ...formData, clarification_context: e.target.value })}
            placeholder="Instructions for the agent on what to ask"
            rows={3}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Book Type'}
        </Button>
      </div>
    </form>
  );
}
