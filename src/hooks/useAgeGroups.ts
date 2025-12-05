import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgeGroup {
  id: string;
  label: string;
  min_age: number;
  max_age: number;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const AGE_GROUPS_KEY = ['age-groups'];

/**
 * Hook to fetch all age groups (active only for selectors, all for admin)
 */
export function useAgeGroups(includeInactive = false) {
  return useQuery({
    queryKey: [...AGE_GROUPS_KEY, includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('age_groups')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as AgeGroup[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for CRUD operations on age groups (admin only)
 */
export function useAgeGroupMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (ageGroup: Omit<AgeGroup, 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('age_groups')
        .insert(ageGroup)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGE_GROUPS_KEY });
      toast.success('Age group created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create age group: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AgeGroup> & { id: string }) => {
      const { data, error } = await supabase
        .from('age_groups')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGE_GROUPS_KEY });
      toast.success('Age group updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update age group: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('age_groups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGE_GROUPS_KEY });
      toast.success('Age group deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete age group: ${error.message}`);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index + 1,
      }));
      
      // Update each in sequence (Supabase doesn't support bulk update by different values)
      for (const update of updates) {
        const { error } = await supabase
          .from('age_groups')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGE_GROUPS_KEY });
      toast.success('Order updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reorder: ${error.message}`);
    },
  });

  return {
    createAgeGroup: createMutation.mutate,
    updateAgeGroup: updateMutation.mutate,
    deleteAgeGroup: deleteMutation.mutate,
    reorderAgeGroups: reorderMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}
