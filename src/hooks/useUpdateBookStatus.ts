import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Toast notifications removed

import { PublicationStatus } from '@/types/shared';

type BookStatus = PublicationStatus;

interface UpdateBookStatusData {
  bookId: string;
  status: BookStatus;
}

export const useUpdateBookStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookId, status }: UpdateBookStatusData) => {
      const { data, error } = await supabase
        .from('books')
        .update({ status })
        .eq('id', bookId)
        .select()
        .single();
      
      if (error) {
        console.error('Failed to update book status:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['book', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      
      console.log(`Book status changed to ${variables.status}`);
    },
    onError: (error: any) => {
      console.error('Failed to update book status:', error);
      console.error('Failed to update book status. Please try again.');
    },
  });
};
