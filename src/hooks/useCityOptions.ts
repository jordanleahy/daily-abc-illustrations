import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddCityParams {
  id: string;
  label: string;
  emoji?: string;
}

export const useAddCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, label, emoji = '🏙️' }: AddCityParams) => {
      // Get the max sort_order
      const { data: maxSortData } = await supabase
        .from('cities')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const nextSortOrder = (maxSortData?.sort_order ?? 0) + 1;

      const { data, error } = await supabase
        .from('cities')
        .insert({
          id,
          label,
          emoji,
          is_active: true,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      toast.success('City added successfully');
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
      toast.success('City removed from options');
    },
    onError: (error: Error) => {
      console.error('Error removing city:', error);
      toast.error('Failed to remove city: ' + error.message);
    },
  });
};
