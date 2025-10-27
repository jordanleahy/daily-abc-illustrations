import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { Page } from '@/types/book';

interface InsertPageParams {
  bookId: string;
  insertAfterPageNumber: number; // 0 means insert at beginning
  title: string;
  description?: string;
}

export const useInsertPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ bookId, insertAfterPageNumber, title, description }: InsertPageParams) => {
      if (!user) {
        throw new Error('User must be authenticated to insert a page');
      }

      // Call the database function
      const { data, error } = await supabase.rpc('insert_page_at_position' as any, {
        p_book_id: bookId,
        p_insert_after_page_number: insertAfterPageNumber,
        p_title: title,
        p_description: description || null,
      });

      if (error) {
        console.error('Error inserting page:', error);
        throw error;
      }

      return { success: true, page: data as unknown as Page };
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch pages for this book
      queryClient.invalidateQueries({ queryKey: ['book-pages', variables.bookId] });
      toast.success('Page inserted successfully');
    },
    onError: (error: any) => {
      console.error('Error inserting page:', error);
      toast.error(error.message || 'Failed to insert page');
    },
  });
};
