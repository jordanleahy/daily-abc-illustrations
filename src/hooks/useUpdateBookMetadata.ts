import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookMetadata } from '@/types/book';
import { toast } from 'sonner';
import { queryKeys } from '@/hooks/queryKeys';

interface UpdateMetadataParams {
  updates: Partial<BookMetadata>;
}

export const useUpdateBookMetadata = (bookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updates }: UpdateMetadataParams) => {
      // Fetch current metadata
      const { data: book, error: fetchError } = await supabase
        .from('books')
        .select('metadata')
        .eq('id', bookId)
        .single();

      if (fetchError) throw fetchError;

      // Merge updates with existing metadata
      const updatedMetadata = {
        ...(book.metadata as BookMetadata || {}),
        ...updates,
      };

      // Update database
      const { error: updateError } = await supabase
        .from('books')
        .update({ 
          metadata: updatedMetadata, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookId);

      if (updateError) throw updateError;

      return updatedMetadata;
    },
    onMutate: async ({ updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['books'] });

      // Snapshot previous value
      const previousBooks = queryClient.getQueryData(['books']);

      // Optimistically update cache
      queryClient.setQueryData(['books'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          books: old.books?.map((book: any) =>
            book.id === bookId
              ? {
                  ...book,
                  metadata: { ...(book.metadata || {}), ...updates },
                }
              : book
          ),
        };
      });

      return { previousBooks };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousBooks) {
        queryClient.setQueryData(['books'], context.previousBooks);
      }
      toast.error('Failed to update metadata', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
    onSuccess: (data, { updates }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.byBook(bookId) });

      // Success feedback
      const updatedFields = Object.keys(updates).join(', ');
      toast.success('Metadata updated', {
        description: `Updated: ${updatedFields}`,
      });
    },
  });
};
