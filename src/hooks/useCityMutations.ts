import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
}

interface AddCityParams {
  id: string;
  label: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
  state?: string;
  country?: string;
  emoji?: string;
}

// Hook for Google Places autocomplete
export const usePlacesAutocomplete = () => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchPlaces = useCallback(async (input: string) => {
    if (!input || input.length < 2) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/google-places-autocomplete?action=autocomplete&input=${encodeURIComponent(input)}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.error) {
        console.error('Places autocomplete error:', result.error);
        setPredictions([]);
      } else {
        setPredictions(result.predictions || []);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      const response = await fetch(
        `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/google-places-autocomplete?action=details&place_id=${encodeURIComponent(placeId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.error) {
        console.error('Place details error:', result.error);
        return null;
      }
      
      return result.details;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
  }, []);

  return {
    predictions,
    isLoading,
    searchPlaces,
    getPlaceDetails,
    clearPredictions,
  };
};

export const useAddCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, label, place_id, latitude, longitude, state, country, emoji = '🏙️' }: AddCityParams) => {
      // Get the max sort_order
      const { data: maxSortData } = await supabase
        .from('cities')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const nextSortOrder = (maxSortData?.sort_order ?? 0) + 1;

      // Upsert the city - reactivates if previously soft-deleted
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .upsert({
          id,
          label,
          emoji,
          place_id,
          latitude,
          longitude,
          state,
          country,
          is_active: true,
          sort_order: nextSortOrder,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (cityError) throw cityError;

      // If we have coordinates, fetch nearby landmarks
      if (latitude && longitude) {
        try {
          console.log(`Fetching nearby landmarks for ${label}...`);
          
          const response = await fetch(
            `https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/google-places-autocomplete?action=nearby&lat=${latitude}&lng=${longitude}&city_id=${id}`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const result = await response.json();

          if (result.landmarks && result.landmarks.length > 0) {
            console.log(`Found ${result.landmarks.length} landmarks, inserting...`);
            
            // Get max sort_order for landmarks in this city
            const { data: maxLandmarkSort } = await supabase
              .from('city_landmarks')
              .select('sort_order')
              .eq('city_id', id)
              .order('sort_order', { ascending: false })
              .limit(1)
              .single();

            let sortOrder = (maxLandmarkSort?.sort_order ?? 0) + 1;

            // Prepare landmarks for insertion
            const landmarksToInsert = result.landmarks.map((landmark: any) => ({
              city_id: id,
              name: landmark.name,
              description: landmark.description || `A notable ${landmark.type} in ${label}`,
              type: landmark.type,
              category: landmark.category,
              google_place_id: landmark.google_place_id,
              visual_cues: landmark.visual_cues,
              is_major: landmark.is_major,
              is_active: true,
              sort_order: sortOrder++,
            }));

            const { error: landmarksError } = await supabase
              .from('city_landmarks')
              .insert(landmarksToInsert);

            if (landmarksError) {
              console.error('Error inserting landmarks:', landmarksError);
              // Don't throw - city was added successfully, landmarks are optional
            } else {
              console.log(`Successfully inserted ${landmarksToInsert.length} landmarks`);
            }
          }
        } catch (err) {
          console.error('Error fetching landmarks:', err);
          // Don't throw - city was added successfully
        }
      }

      return cityData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      queryClient.invalidateQueries({ queryKey: ['city-landmarks'] });
      toast.success('City added with landmarks');
    },
    onError: (error: Error) => {
      console.error('Error adding city:', error);
      toast.error('Failed to add city: ' + error.message);
    },
  });
};

export const useDeleteCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cityId: string) => {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('cities')
        .update({ is_active: false })
        .eq('id', cityId);

      if (error) throw error;
      return cityId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('City removed from options');
    },
    onError: (error: Error) => {
      console.error('Error removing city:', error);
      toast.error('Failed to remove city: ' + error.message);
    },
  });
};
