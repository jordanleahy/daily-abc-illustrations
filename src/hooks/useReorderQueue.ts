import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReorderQueueData {
  items: Array<{ id: string; queue_order: number }>;
}

export const useReorderQueue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ReorderQueueData) => {
      // Update queue_order for all items in parallel
      const updatePromises = data.items.map(item => 
        supabase
          .from('daily_published')
          .update({ queue_order: item.queue_order })
          .eq('id', item.id)
      );
      
      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Some queue updates failed:', errors);
        throw new Error('Failed to update queue order');
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      toast.success('Queue reordered successfully');
    },
    onError: (error) => {
      console.error('Failed to reorder queue:', error);
      toast.error('Failed to reorder queue');
    },
  });
};