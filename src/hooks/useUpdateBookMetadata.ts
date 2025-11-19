import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookMetadata } from '@/types/book';
import { toast } from 'sonner';
import { queryKeys } from '@/hooks/queryKeys';
import { useRef, useCallback } from 'react';

interface UpdateMetadataParams {
  updates: Partial<BookMetadata>;
}

export const useUpdateBookMetadata = (bookId: string) => {
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const pendingUpdatesRef = useRef<Partial<BookMetadata>>({});

  const mutation = useMutation({
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
      await queryClient.cancelQueries({ queryKey: ['book', bookId] });

      // Snapshot previous values
      const previousBooks = queryClient.getQueryData(['books']);
      const previousBook = queryClient.getQueryData(['book', bookId]);

      // Optimistically update all relevant caches immediately
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

      // Update individual book cache
      queryClient.setQueryData(['book', bookId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          metadata: { ...(old.metadata || {}), ...updates },
        };
      });

      return { previousBooks, previousBook };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousBooks) {
        queryClient.setQueryData(['books'], context.previousBooks);
      }
      if (context?.previousBook) {
        queryClient.setQueryData(['book', bookId], context.previousBook);
      }
      toast.error('Failed to update metadata', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
    onSuccess: () => {
      // Silently invalidate queries in the background
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.pages.byBook(bookId) });
    },
  });

  // Debounced mutate function
  const debouncedMutate = useCallback(({ updates }: UpdateMetadataParams) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Accumulate updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // Immediately update UI optimistically
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

    queryClient.setQueryData(['book', bookId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        metadata: { ...(old.metadata || {}), ...updates },
      };
    });

    // Debounce the actual database write
    debounceTimerRef.current = setTimeout(() => {
      const allUpdates = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};
      mutation.mutate({ updates: allUpdates });
    }, 500); // 500ms debounce
  }, [bookId, mutation, queryClient]);

  return {
    ...mutation,
    mutate: debouncedMutate,
  };
};
