import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RequeueExpiredItemData {
  id: string;
  publish_date: string;
}

export const useRequeueExpiredItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RequeueExpiredItemData) => {
      const { error } = await supabase
        .from('daily_published')
        .update({
          status: 'queued',
          publish_date: data.publish_date,
          is_active: false
        })
        .eq('id', data.id);
      
      if (error) {
        console.error('Failed to requeue expired item:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
    },
    onError: (error) => {
      console.error('Failed to requeue item:', error);
    },
  });
};
