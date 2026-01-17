import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Loader2, List, MapPin, Search, Check } from 'lucide-react';
import { useAddCity, useDeleteCity, usePlacesAutocomplete, PlaceDetails } from '@/hooks/useCityMutations';

interface CityOption {
  value: string;
  label: string;
}

interface CityOptionManagerProps {
  questionId: string;
}

export function CityOptionManager({ questionId }: CityOptionManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState<CityOption | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  const { predictions, isLoading: isSearching, searchPlaces, getPlaceDetails, clearPredictions } = usePlacesAutocomplete();
  const addCity = useAddCity();
  const deleteCity = useDeleteCity();

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (searchInput.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchPlaces(searchInput);
      }, 300);
    } else {
      clearPredictions();
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchInput, searchPlaces, clearPredictions]);

  const handleSelectPlace = async (placeId: string) => {
    setIsLoadingDetails(true);
    clearPredictions();
    
    const details = await getPlaceDetails(placeId);
    if (details) {
      setSelectedPlace(details);
      setSearchInput(details.name);
    }
    setIsLoadingDetails(false);
  };

  const resetDialog = () => {
    setSearchInput('');
    setSelectedPlace(null);
    clearPredictions();
  };

  const { data: cities, isLoading } = useQuery({
    queryKey: ['question-options', 'cities'],
    queryFn: async (): Promise<CityOption[]> => {
      const { data, error } = await supabase
        .from('cities')
        .select('id, label')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []).map((item) => ({
        value: item.id,
        label: item.label,
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5 text-primary" />
            City Options ({cities?.length || 0})
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => {
              resetDialog();
              setIsAddDialogOpen(true);
            }}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add City
          </Button>
        </CardHeader>
        <CardContent>
          {cities && cities.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((option) => (
                <div 
                  key={option.value}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{option.label}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{option.value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteOption(option)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No cities available.</p>
          )}
        </CardContent>
      </Card>

      {/* Add City Bottom Sheet */}
      <Drawer open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetDialog();
      }}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Add New City
            </DrawerTitle>
            <DrawerDescription>
              Search for a city using Google Places to get accurate location data.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4 overflow-y-auto">
            <div className="space-y-2 relative">
              <Label htmlFor="citySearch">Search City</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="citySearch"
                  placeholder="Start typing a city name..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setSelectedPlace(null);
                  }}
                  autoComplete="off"
                  className="pl-9"
                />
                {(isSearching || isLoadingDetails) && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {/* Autocomplete dropdown */}
              {predictions.length > 0 && !selectedPlace && (
                <div className="bg-muted border border-border rounded-lg max-h-48 overflow-auto">
                  {predictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      className="w-full px-3 py-3 text-left hover:bg-accent focus:bg-accent focus:outline-none transition-colors flex items-start gap-3 border-b border-border/50 last:border-0"
                      onClick={() => handleSelectPlace(prediction.place_id)}
                    >
                      <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{prediction.main_text}</p>
                        <p className="text-xs text-muted-foreground truncate">{prediction.secondary_text}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {searchInput.length > 0 && searchInput.length < 2 && !selectedPlace && (
                <p className="text-xs text-muted-foreground">Type at least 2 characters to search...</p>
              )}
              {searchInput.length >= 2 && predictions.length === 0 && !isSearching && !selectedPlace && (
                <p className="text-xs text-muted-foreground">No cities found. Try a different search term.</p>
              )}
            </div>

            {/* Selected city details */}
            {selectedPlace && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{selectedPlace.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {selectedPlace.state && (
                    <div>
                      <span className="text-xs font-medium">State:</span> {selectedPlace.state}
                    </div>
                  )}
                  {selectedPlace.country && (
                    <div>
                      <span className="text-xs font-medium">Country:</span> {selectedPlace.country}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium">Lat:</span> {selectedPlace.latitude?.toFixed(4)}
                  </div>
                  <div>
                    <span className="text-xs font-medium">Lng:</span> {selectedPlace.longitude?.toFixed(4)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DrawerFooter className="pt-2">
            <Button 
              onClick={() => {
                if (selectedPlace) {
                  const cityId = selectedPlace.name
                    .toUpperCase()
                    .replace(/[^A-Z0-9\s]/g, '')
                    .replace(/\s+/g, '_')
                    .trim();
                  
                  addCity.mutate(
                    {
                      id: cityId,
                      label: selectedPlace.name,
                      place_id: selectedPlace.place_id,
                      latitude: selectedPlace.latitude,
                      longitude: selectedPlace.longitude,
                      state: selectedPlace.state,
                      country: selectedPlace.country,
                    },
                    {
                      onSuccess: () => {
                        setIsAddDialogOpen(false);
                        resetDialog();
                      },
                    }
                  );
                }
              }}
              disabled={!selectedPlace || addCity.isPending}
              className="w-full"
            >
              {addCity.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add City
                </>
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete City Confirmation */}
      <AlertDialog open={!!deleteOption} onOpenChange={(open) => !open && setDeleteOption(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deleteOption?.label}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteOption) {
                  deleteCity.mutate(deleteOption.value, {
                    onSuccess: () => setDeleteOption(null),
                  });
                }
              }}
              disabled={deleteCity.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCity.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
