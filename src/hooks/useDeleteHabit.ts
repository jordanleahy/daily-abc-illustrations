import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

/**
 * Hook to delete a habit (soft delete by setting is_active to false)
 */
export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (habitId: string) => {
      // Fetch the habit to get its title and parent_user_id
      const { data: habitRow, error: fetchError } = await supabase
        .from('habits')
        .select('title, parent_user_id')
        .eq('id', habitId)
        .single();

      if (fetchError) throw fetchError;

      // Soft delete ALL habits with the same title for this parent (handles duplicates)
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('parent_user_id', habitRow.parent_user_id)
        .eq('title', habitRow.title)
        .eq('is_active', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({
        title: 'Success',
        description: 'Habit deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete habit: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
