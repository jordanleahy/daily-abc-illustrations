import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Plus, Pencil, Trash2, Loader2, List, Mountain, Search, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useResortPlacesAutocomplete, useAddResort, ResortPrediction } from '@/hooks/useResortMutations';

interface Resort {
  id: string;
  label: string;
  description: string | null;
  location: string | null;
  state: string | null;
  country: string | null;
  terrain: string | null;
  difficulty_levels: string[] | null;
  signature_runs: string[] | null;
  atmosphere: string | null;
  emoji: string;
  sort_order: number;
  is_active: boolean;
}

interface ResortFormData {
  id: string;
  label: string;
  description: string;
  location: string;
  state: string;
  country: string;
  terrain: string;
  difficulty_levels: string;
  signature_runs: string;
  atmosphere: string;
  is_active: boolean;
}

const defaultFormData: ResortFormData = {
  id: '',
  label: '',
  description: '',
  location: '',
  state: '',
  country: 'USA',
  terrain: '',
  difficulty_levels: '',
  signature_runs: '',
  atmosphere: '',
  is_active: true,
};

interface ResortOptionManagerProps {
  questionId: string;
}

export function ResortOptionManager({ questionId }: ResortOptionManagerProps) {
  const queryClient = useQueryClient();
  
  const { data: resorts, isLoading } = useQuery({
    queryKey: ['resorts', 'all'],
    queryFn: async (): Promise<Resort[]> => {
      const { data, error } = await supabase
        .from('resorts')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Places autocomplete hooks
  const { 
    predictions, 
    isLoading: isSearching, 
    searchResorts, 
    getResortDetails, 
    enrichResortWithAI,
    clearPredictions 
  } = useResortPlacesAutocomplete();
  const addResortMutation = useAddResort();

  const createMutation = useMutation({
    mutationFn: async (data: { id: string; label: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('resorts').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resorts'] });
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      toast.success('Resort created');
    },
    onError: (error) => {
      toast.error('Failed to create resort');
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Resort> & { id: string }) => {
      const { error } = await supabase.from('resorts').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resorts'] });
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      toast.success('Resort updated');
    },
    onError: (error) => {
      toast.error('Failed to update resort');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('resorts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resorts'] });
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      toast.success('Resort deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete resort');
      console.error(error);
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSearchDrawerOpen, setIsSearchDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ResortFormData>(defaultFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<ResortPrediction | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchResorts(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchResorts]);

  const handleOpenCreate = () => {
    setIsSearchDrawerOpen(true);
    setSearchQuery('');
    clearPredictions();
  };

  const handleOpenManualCreate = () => {
    setIsSearchDrawerOpen(false);
    setEditingId(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (resort: Resort) => {
    setEditingId(resort.id);
    setFormData({
      id: resort.id,
      label: resort.label,
      description: resort.description || '',
      location: resort.location || '',
      state: resort.state || '',
      country: resort.country || 'USA',
      terrain: resort.terrain || '',
      difficulty_levels: resort.difficulty_levels?.join(', ') || '',
      signature_runs: resort.signature_runs?.join(', ') || '',
      atmosphere: resort.atmosphere || '',
      is_active: resort.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSelectPrediction = async (prediction: ResortPrediction) => {
    setSelectedPrediction(prediction);
    setIsEnriching(true);
    
    try {
      // Get place details
      const details = await getResortDetails(prediction.place_id);
      if (!details) {
        toast.error('Failed to get resort details');
        setIsEnriching(false);
        return;
      }

      // Get AI enrichment
      const enrichment = await enrichResortWithAI(
        details.name,
        details.state,
        details.country
      );

      // Create the resort with all data
      const resortId = details.name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      await addResortMutation.mutateAsync({
        id: resortId,
        label: details.name,
        state: details.state,
        country: details.country,
        location: details.location,
        terrain: enrichment?.terrain,
        difficulty_levels: enrichment?.difficulty_levels,
        signature_runs: enrichment?.signature_runs,
        atmosphere: enrichment?.atmosphere,
        color_palette: enrichment?.color_palette,
      });

      setIsSearchDrawerOpen(false);
      setSearchQuery('');
      clearPredictions();
    } catch (error) {
      console.error('Error adding resort:', error);
      toast.error('Failed to add resort');
    } finally {
      setIsEnriching(false);
      setSelectedPrediction(null);
    }
  };

  const handleSave = () => {
    const nextSortOrder = resorts ? Math.max(...resorts.map(r => r.sort_order), 0) + 1 : 1;
    
    const resortData = {
      label: formData.label,
      description: formData.description || null,
      location: formData.location || null,
      state: formData.state || null,
      country: formData.country || 'USA',
      terrain: formData.terrain || null,
      difficulty_levels: formData.difficulty_levels ? formData.difficulty_levels.split(',').map(s => s.trim()).filter(Boolean) : null,
      signature_runs: formData.signature_runs ? formData.signature_runs.split(',').map(s => s.trim()).filter(Boolean) : null,
      atmosphere: formData.atmosphere || null,
      is_active: formData.is_active,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...resortData });
    } else {
      createMutation.mutate({
        id: formData.id,
        ...resortData,
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

  const handleToggleActive = (resort: Resort) => {
    updateMutation.mutate({
      id: resort.id,
      is_active: !resort.is_active,
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
          Resort Options ({resorts?.length || 0})
        </CardTitle>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Resort
        </Button>
      </CardHeader>
      <CardContent>
        {resorts && resorts.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {resorts.map((resort) => (
              <div 
                key={resort.id}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group ${!resort.is_active ? 'opacity-50' : ''}`}
              >
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <Mountain className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{resort.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{resort.state || resort.location}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Switch
                    checked={resort.is_active}
                    onCheckedChange={() => handleToggleActive(resort)}
                    disabled={updateMutation.isPending}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenEdit(resort)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleOpenDelete(resort.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No resorts available.</p>
        )}

        {/* Search Drawer (Bottom Sheet) */}
        <Drawer open={isSearchDrawerOpen} onOpenChange={setIsSearchDrawerOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-2">
                <Mountain className="h-5 w-5 text-primary" />
                Add Ski Resort
              </DrawerTitle>
              <DrawerDescription>
                Search for a ski resort to add with AI-generated details
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ski resorts (e.g., Vail, Aspen, Park City)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {predictions.length > 0 ? (
                  predictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      onClick={() => handleSelectPrediction(prediction)}
                      disabled={isEnriching}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left disabled:opacity-50"
                    >
                      {isEnriching && selectedPrediction?.place_id === prediction.place_id ? (
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{prediction.main_text}</p>
                        <p className="text-xs text-muted-foreground truncate">{prediction.secondary_text}</p>
                      </div>
                      {isEnriching && selectedPrediction?.place_id === prediction.place_id && (
                        <span className="text-xs text-primary">Adding with AI...</span>
                      )}
                    </button>
                  ))
                ) : searchQuery.length >= 2 && !isSearching ? (
                  <p className="text-center text-muted-foreground py-8">
                    No ski resorts found. Try a different search.
                  </p>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Start typing to search for ski resorts
                  </p>
                )}
              </div>

              {/* Manual Entry Option */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenManualCreate}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Add manually instead
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mountain className="h-5 w-5 text-primary" />
                {editingId ? 'Edit Resort' : 'Add Resort'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Resort Name</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    placeholder="e.g., Vail"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id">ID</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={!!editingId}
                    placeholder="e.g., VAIL"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g., Colorado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., USA"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Full Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Vail, Colorado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terrain">Terrain Description</Label>
                <Input
                  id="terrain"
                  value={formData.terrain}
                  onChange={(e) => setFormData({ ...formData, terrain: e.target.value })}
                  placeholder="e.g., Alpine bowls and groomed runs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty_levels">Difficulty Levels (comma-separated)</Label>
                <Input
                  id="difficulty_levels"
                  value={formData.difficulty_levels}
                  onChange={(e) => setFormData({ ...formData, difficulty_levels: e.target.value })}
                  placeholder="e.g., Beginner, Intermediate, Expert"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature_runs">Signature Runs (comma-separated)</Label>
                <Input
                  id="signature_runs"
                  value={formData.signature_runs}
                  onChange={(e) => setFormData({ ...formData, signature_runs: e.target.value })}
                  placeholder="e.g., Back Bowls, Blue Sky Basin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="atmosphere">Atmosphere (for AI illustrations)</Label>
                <Textarea
                  id="atmosphere"
                  value={formData.atmosphere}
                  onChange={(e) => setFormData({ ...formData, atmosphere: e.target.value })}
                  placeholder="e.g., Luxury mountain village with European charm"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about the resort..."
                  rows={2}
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
              <AlertDialogTitle>Delete Resort</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this resort? This action cannot be undone.
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
