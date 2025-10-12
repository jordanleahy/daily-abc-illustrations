import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';

interface CreatePageParams {
  bookId: string;
  title: string;
  description?: string;
  existingPages: number;
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const useCreatePage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ bookId, title, description, existingPages }: CreatePageParams) => {
      if (!user) {
        throw new Error('User must be authenticated to create a page');
      }

      // Fetch the current maximum page_number for this book
      const { data: existingPagesData, error: fetchError } = await supabase
        .from('pages')
        .select('page_number')
        .eq('book_id', bookId)
        .order('page_number', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching existing pages:', fetchError);
        throw fetchError;
      }

      // Determine the next page number and letter
      const maxPageNumber = existingPagesData && existingPagesData.length > 0 
        ? existingPagesData[0].page_number 
        : 0;
      const pageNumber = maxPageNumber + 1;
      const letter = alphabet[(pageNumber - 1) % 26] || 'A';

      // Insert the new page
      const { data, error } = await supabase
        .from('pages')
        .insert({
          book_id: bookId,
          letter,
          page_number: pageNumber,
          title,
          description: description || null,
          content: {
            mainConcept: '',
            funFact: '',
            activity: '',
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating page:', error);
        throw error;
      }

      return { success: true, page: data };
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch pages for this book
      queryClient.invalidateQueries({ queryKey: ['pages', variables.bookId] });
      toast.success('Page created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating page:', error);
      toast.error(error.message || 'Failed to create page');
    },
  });
};
