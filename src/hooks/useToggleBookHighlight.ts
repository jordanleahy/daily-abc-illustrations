import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useToggleBookHighlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, isHighlighted }: { bookId: string; isHighlighted: boolean }) => {
      const { error } = await supabase
        .from('books')
        .update({ is_highlighted: !isHighlighted })
        .eq('id', bookId);

      if (error) throw error;
      
      return { bookId, newValue: !isHighlighted };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', data.bookId] });
      toast.success(data.newValue ? 'Book highlighted for landing page' : 'Book unhighlighted');
    },
    onError: (error) => {
      console.error('Error toggling book highlight:', error);
      toast.error('Failed to update book highlight status');
    },
  });
};
