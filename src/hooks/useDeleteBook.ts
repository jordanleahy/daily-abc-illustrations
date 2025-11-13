import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDeleteBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;
    },
    onMutate: async (bookId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['books'] });
      
      // Snapshot previous value
      const previousBooks = queryClient.getQueryData(['books']);
      
      // Optimistically remove the book from cache
      queryClient.setQueryData(['books'], (old: any) => {
        if (!old) return old;
        return old.filter((book: any) => book.id !== bookId);
      });
      
      return { previousBooks };
    },
    onError: (error, bookId, context) => {
      // Rollback on error
      if (context?.previousBooks) {
        queryClient.setQueryData(['books'], context.previousBooks);
      }
      
      console.error('Delete book error:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Failed to delete the book. Please try again.',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book'] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['book-publication-status'] });
      
      toast({
        title: 'Book Deleted',
        description: 'The book and all its content have been permanently deleted.',
      });
    },
    onSettled: () => {
      // Refetch after mutation completes (success or error)
      queryClient.invalidateQueries({ queryKey: ['book'] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['book-publication-status'] });
    },
  });
};
