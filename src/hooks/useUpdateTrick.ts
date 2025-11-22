import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UpdateTrickData } from '@/types/trick';

/**
 * Hook to update an existing trick
 */
export function useUpdateTrick() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTrickData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { trickId, ...updateData } = data;

      const { data: trickData, error } = await supabase
        .from('tricks')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trickId)
        .eq('parent_user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return trickData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tricks'] });
      toast.success('Trick updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update trick:', error);
      toast.error('Failed to update trick');
    },
  });
}
