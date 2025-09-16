import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeletePage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;
    },
    onSuccess: (_, pageId) => {
      // Invalidate and refetch pages data
      queryClient.invalidateQueries({ queryKey: ['book-pages'] });
      
      toast({
        title: "Page Deleted",
        description: "The page and its associated content have been permanently deleted.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting page:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the page. Please try again.",
        variant: "destructive",
      });
    },
  });
};