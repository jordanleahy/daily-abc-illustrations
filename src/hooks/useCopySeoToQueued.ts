import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCopySeoToQueued = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('copy-seo-draft-to-queued', {
        body: {}
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seo-metadata'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      
      toast({
        title: 'SEO Copied',
        description: `Successfully copied SEO metadata for ${data.copied_count} book(s)`,
      });
    },
    onError: (error) => {
      console.error('Copy SEO error:', error);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Failed to copy SEO metadata',
      });
    },
  });
};