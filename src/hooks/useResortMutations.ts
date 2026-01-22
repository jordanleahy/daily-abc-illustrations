import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ResortPrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface ResortDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  state: string;
  country: string;
  location: string;
}

export interface ResortEnrichment {
  terrain: string;
  difficulty_levels: string[];
  signature_runs: string[];
  atmosphere: string;
  color_palette: string;
}

interface AddResortParams {
  id: string;
  label: string;
  place_id?: string;
  latitude?: number;
  longitude?: number;
  state?: string;
  country?: string;
  location?: string;
  terrain?: string;
  difficulty_levels?: string[];
  signature_runs?: string[];
  atmosphere?: string;
  color_palette?: string;
}

const EDGE_FUNCTION_URL = 'https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/resort-places-autocomplete';

// Hook for Google Places autocomplete for ski resorts
export const useResortPlacesAutocomplete = () => {
  const [predictions, setPredictions] = useState<ResortPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchResorts = useCallback(async (input: string) => {
    if (!input || input.length < 2) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${EDGE_FUNCTION_URL}?action=autocomplete&input=${encodeURIComponent(input)}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.error) {
        console.error('Resort autocomplete error:', result.error);
        setPredictions([]);
      } else {
        setPredictions(result.predictions || []);
      }
    } catch (error) {
      console.error('Error searching resorts:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getResortDetails = useCallback(async (placeId: string): Promise<ResortDetails | null> => {
    try {
      const response = await fetch(
        `${EDGE_FUNCTION_URL}?action=details&place_id=${encodeURIComponent(placeId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.error) {
        console.error('Resort details error:', result.error);
        return null;
      }
      
      return result.details;
    } catch (error) {
      console.error('Error fetching resort details:', error);
      return null;
    }
  }, []);

  const enrichResortWithAI = useCallback(async (name: string, state: string, country: string): Promise<ResortEnrichment | null> => {
    try {
      const params = new URLSearchParams({
        action: 'enrich',
        name,
        state,
        country,
      });

      const response = await fetch(
        `${EDGE_FUNCTION_URL}?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.error) {
        console.error('Resort enrichment error:', result.error);
        return null;
      }
      
      return result.enrichment;
    } catch (error) {
      console.error('Error enriching resort:', error);
      return null;
    }
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
  }, []);

  return {
    predictions,
    isLoading,
    searchResorts,
    getResortDetails,
    enrichResortWithAI,
    clearPredictions,
  };
};

export const useAddResort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddResortParams) => {
      // Get the max sort_order
      const { data: maxSortData } = await supabase
        .from('resorts')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const nextSortOrder = (maxSortData?.sort_order ?? 0) + 1;

      // Upsert the resort - reactivates if previously soft-deleted
      const { data: resortData, error: resortError } = await supabase
        .from('resorts')
        .upsert({
          id: params.id,
          label: params.label,
          emoji: '⛷️',
          state: params.state || null,
          country: params.country || 'USA',
          location: params.location || null,
          terrain: params.terrain || null,
          difficulty_levels: params.difficulty_levels || null,
          signature_runs: params.signature_runs || null,
          atmosphere: params.atmosphere || null,
          color_palette: params.color_palette || null,
          is_active: true,
          sort_order: nextSortOrder,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (resortError) throw resortError;

      return resortData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      queryClient.invalidateQueries({ queryKey: ['resorts'] });
      toast.success('Resort added with AI-generated details');
    },
    onError: (error: Error) => {
      console.error('Error adding resort:', error);
      toast.error('Failed to add resort: ' + error.message);
    },
  });
};

export const useDeleteResort = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resortId: string) => {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('resorts')
        .update({ is_active: false })
        .eq('id', resortId);

      if (error) throw error;
      return resortId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      queryClient.invalidateQueries({ queryKey: ['resorts'] });
      toast.success('Resort removed from options');
    },
    onError: (error: Error) => {
      console.error('Error removing resort:', error);
      toast.error('Failed to remove resort: ' + error.message);
    },
  });
};
