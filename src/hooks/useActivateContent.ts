import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to handle activating daily published content that should be live
 * Calls the activate-daily-published-content edge function
 */
export const useActivateContent = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('Calling simple-daily-publisher function...');
      
      const { data, error } = await supabase.functions.invoke('simple-daily-publisher', {
        body: {}
      });

      if (error) {
        console.error('Error calling simple daily publisher function:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Simple daily publisher response:', data);
      
      if (data?.results?.changes?.activated_items > 0) {
        toast({
          title: 'Content Activated',
          description: `${data.results.changes.activated_items} item(s) have been activated`,
        });
      }

      if (data?.results?.changes?.expired_items > 0) {
        toast({
          title: 'Content Expired',
          description: `${data.results.changes.expired_items} expired item(s) have been removed`,
        });
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['daily-published'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['active-daily-published'] });
    },
    onError: (error) => {
      console.error('Failed to activate content:', error);
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: 'Failed to process daily publishing. Please try refreshing the page.',
      });
    },
  });
};