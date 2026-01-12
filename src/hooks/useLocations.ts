import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LocationRecord {
  id: string;
  label: string;
  emoji: string;
  description: string | null;
  spelling_guide: string | null;
  terrain: string | null;
  architecture: string | null;
  landmarks: string[] | null;
  color_palette: string | null;
  atmosphere: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface LocationOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

/**
 * Hook to fetch locations from the database
 */
export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async (): Promise<LocationRecord[]> => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching locations:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour (locations change rarely)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook to get locations formatted for UI selection
 */
export function useLocationOptions() {
  const { data: locations, isLoading, error } = useLocations();

  const options: LocationOption[] = (locations || []).map(loc => ({
    id: loc.id,
    label: loc.label,
    emoji: loc.emoji,
    description: loc.description || '',
  }));

  return { options, isLoading, error };
}

/**
 * Get a location by ID from the cached data
 */
export function getLocationFromCache(locations: LocationRecord[], locationId: string): LocationRecord | undefined {
  return locations.find(l => l.id === locationId);
}

/**
 * Format locations for suggested actions in chat
 */
export function formatLocationsForSuggestedActions(locations: LocationRecord[]) {
  return locations.map(loc => ({
    id: loc.id,
    label: `${loc.emoji} ${loc.label}`,
    value: loc.label,
    locationId: loc.id,
  }));
}
