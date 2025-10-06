import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ReorderQueueData {
  items: Array<{ id: string; publish_date: string }>;
}

export const useReorderQueue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ReorderQueueData) => {
      // Update publish_date for all items in parallel
      const updatePromises = data.items.map(item => 
        supabase
          .from('daily_published')
          .update({ publish_date: item.publish_date })
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
    },
    onError: (error) => {
      console.error('Failed to reorder queue:', error);
    },
  });
};