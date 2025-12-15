import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBulkDeleteBooks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookIds: string[]) => {
      // Delete books one by one to ensure cascade works properly
      const errors: string[] = [];
      
      for (const bookId of bookIds) {
        const { error } = await supabase
          .from('books')
          .delete()
          .eq('id', bookId);
        
        if (error) {
          errors.push(bookId);
          console.error(`Failed to delete book ${bookId}:`, error);
        }
      }
      
      if (errors.length > 0) {
        throw new Error(`Failed to delete ${errors.length} book(s)`);
      }
    },
    onMutate: async (bookIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['books'] });
      const previousBooks = queryClient.getQueryData(['books']);
      
      queryClient.setQueryData(['books'], (old: any) => {
        if (!old) return old;
        return old.filter((book: any) => !bookIds.includes(book.id));
      });
      
      return { previousBooks };
    },
    onError: (error, bookIds, context) => {
      if (context?.previousBooks) {
        queryClient.setQueryData(['books'], context.previousBooks);
      }
      
      console.error('Bulk delete error:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Some books failed to delete. Please try again.',
      });
    },
    onSuccess: (_, bookIds) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book'] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      
      toast({
        title: 'Books Deleted',
        description: `Successfully deleted ${bookIds.length} book(s).`,
      });
    },
  });
};
