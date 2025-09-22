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
      console.log('Calling activate-daily-published-content function...');
      
      const { data, error } = await supabase.functions.invoke('activate-daily-published-content', {
        body: {}
      });

      if (error) {
        console.error('Error calling activate function:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Activate content response:', data);
      
      if (data?.activated_count > 0) {
        toast({
          title: 'Content Activated',
          description: `${data.activated_count} item(s) have been activated`,
        });
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['daily-published'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      queryClient.invalidateQueries({ queryKey: ['active-daily-published'] });
    },
    onError: (error) => {
      console.error('Failed to activate content:', error);
      toast({
        variant: 'destructive',
        title: 'Activation Failed',
        description: 'Failed to activate content. Please try refreshing the page.',
      });
    },
  });
};