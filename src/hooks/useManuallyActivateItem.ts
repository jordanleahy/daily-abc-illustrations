import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useManuallyActivateItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data, error } = await supabase.rpc('admin_manually_activate_item', {
        p_item_id: itemId
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to activate item');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Item Activated',
        description: 'The selected item is now live. Previous item moved to queue.',
      });

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['daily-published'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      queryClient.invalidateQueries({ queryKey: ['active-daily-published'] });
    },
    onError: (error) => {
      console.error('Failed to manually activate item:', error);
      toast({
        variant: 'destructive',
        title: 'Activation Failed',
        description: error instanceof Error ? error.message : 'Failed to activate item',
      });
    },
  });
};
