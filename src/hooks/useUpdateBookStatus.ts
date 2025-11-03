import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { PublicationStatus } from '@/types/shared';

type BookStatus = PublicationStatus;

interface UpdateBookStatusData {
  bookId: string;
  status: BookStatus;
}

export const useUpdateBookStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ bookId, status }: UpdateBookStatusData) => {
      // If changing to published, check for existing daily_published entries
      if (status === 'published') {
        const { data: existingPublished, error: checkError } = await supabase
          .from('daily_published')
          .select('id, status')
          .eq('book_id', bookId)
          .in('status', ['queued', 'active'])
          .maybeSingle();

        if (checkError) {
          console.error('Error checking daily_published:', checkError);
        }

        if (existingPublished) {
          throw new Error('ALREADY_IN_QUEUE');
        }
      }

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
      
      toast({
        title: 'Status Updated',
        description: `Book status changed to ${variables.status}`,
      });
    },
    onError: (error: any) => {
      console.error('Failed to update book status:', error);
      
      const description = error?.message === 'ALREADY_IN_QUEUE'
        ? 'This book is already in the publishing queue'
        : 'Failed to update book status. Please try again.';
      
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description,
      });
    },
  });
};
