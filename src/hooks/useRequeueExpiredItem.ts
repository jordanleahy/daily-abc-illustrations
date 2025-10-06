import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
          is_active: false,
          published_at: null,
          expires_at: null,
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
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      toast.success('Item requeued successfully');
    },
    onError: (error) => {
      console.error('Failed to requeue item:', error);
      toast.error('Failed to requeue item');
    },
  });
};
