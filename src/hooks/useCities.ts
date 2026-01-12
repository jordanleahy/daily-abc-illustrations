import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface City {
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
  og_image: string | null;
  seo_description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CityOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

/**
 * Fetches active cities from the database
 * Uses 1-hour cache since cities rarely change
 */
export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async (): Promise<City[]> => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching cities:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour (cities change rarely)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Returns cities formatted for UI selection components
 */
export function useCityOptions() {
  const { data: cities, ...rest } = useCities();
  
  const options: CityOption[] = (cities || []).map(city => ({
    id: city.id,
    label: city.label,
    emoji: city.emoji,
    description: city.description || '',
  }));

  return { data: options, ...rest };
}

/**
 * Get a single city by ID
 */
export function useCity(cityId: string | undefined) {
  const { data: cities, ...rest } = useCities();
  
  const city = cityId 
    ? cities?.find(c => c.id === cityId) 
    : undefined;

  return { data: city, ...rest };
}

/**
 * Get city display string (emoji + label)
 */
export function getCityDisplay(city: City): string {
  return `${city.emoji} ${city.label}`;
}

/**
 * Check if a value is a valid city ID
 */
export function isValidCityId(cityId: string, cities: City[]): boolean {
  if (cityId === 'NONE') return true;
  return cities.some(c => c.id === cityId);
}
