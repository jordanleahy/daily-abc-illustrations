import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook to soft delete a trick by setting is_active to false
 */
export function useDeleteTrick() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trickId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tricks')
        .update({ is_active: false })
        .eq('id', trickId)
        .eq('parent_user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tricks'] });
      queryClient.invalidateQueries({ queryKey: ['trick-goals'] });
      toast.success('Trick deleted');
    },
    onError: (error) => {
      console.error('Failed to delete trick:', error);
      toast.error('Failed to delete trick');
    },
  });
}
