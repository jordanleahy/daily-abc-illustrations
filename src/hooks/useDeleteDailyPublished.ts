import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteDailyPublished = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dailyPublishedId: string) => {
      const { error } = await supabase
        .from('daily_published')
        .delete()
        .eq('id', dailyPublishedId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      
      toast({
        title: 'Deleted',
        description: 'Daily published entry removed successfully',
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Failed to delete the entry',
      });
    },
  });
};
