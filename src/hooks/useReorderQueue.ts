import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReorderItem {
  id: string;
  newPosition: number;
}

export const useReorderQueue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reorderedItems: ReorderItem[]) => {
      const { data, error } = await supabase.functions.invoke('reorder-daily-published-queue', {
        body: { reorderedItems }
      });

      if (error) {
        console.error('Error reordering queue:', error);
        throw new Error(error.message || 'Failed to reorder queue');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch the queue data
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      toast({
        title: "Queue reordered",
        description: "The publishing queue has been successfully reordered.",
      });
    },
    onError: (error) => {
      console.error('Queue reorder error:', error);
      toast({
        title: "Reorder failed", 
        description: error.message || "Failed to reorder the queue. Please try again.",
        variant: "destructive"
      });
    }
  });
};