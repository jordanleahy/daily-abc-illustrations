import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to handle expiring daily published content
 * Calls the expire-daily-published-content edge function
 */
export const useExpireContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('Calling expire-daily-published-content function...');
      
      const { data, error } = await supabase.functions.invoke('expire-daily-published-content', {
        body: {}
      });

      if (error) {
        console.error('Error calling expire function:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Expire content response:', data);
      
      if (data?.expired_count > 0) {
        toast({
          title: 'Content Expired',
          description: `${data.expired_count} expired item(s) have been removed from the queue`,
        });
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['daily-published'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      queryClient.invalidateQueries({ queryKey: ['active-daily-published'] });
    },
    onError: (error) => {
      console.error('Failed to expire content:', error);
      toast({
        variant: 'destructive',
        title: 'Expiration Failed',
        description: 'Failed to update expired content. Please try refreshing the page.',
      });
    },
  });
};