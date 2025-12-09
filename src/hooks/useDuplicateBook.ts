import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Book, Page } from '@/types/book';

interface DuplicateBookParams {
  bookId: string;
  userId: string;
}

export const useDuplicateBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, userId }: DuplicateBookParams) => {
      // Fetch the original book
      const { data: originalBook, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (bookError || !originalBook) {
        throw new Error('Failed to fetch original book');
      }

      // Fetch all pages for the original book
      const { data: originalPages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (pagesError) {
        throw new Error('Failed to fetch book pages');
      }

      // Create new book with (Copy) suffix and draft status
      const { data: newBook, error: newBookError } = await supabase
        .from('books')
        .insert({
          user_id: userId,
          book_name: `${originalBook.book_name} (Copy)`,
          category: originalBook.category,
          book_description: originalBook.book_description,
          total_pages: originalBook.total_pages,
          status: 'draft',
        })
        .select()
        .single();

      if (newBookError || !newBook) {
        throw new Error('Failed to create duplicate book');
      }

      // Duplicate all pages if there are any
      if (originalPages && originalPages.length > 0) {
        const pagesToInsert = originalPages.map((page) => ({
          book_id: newBook.id,
          letter: page.letter,
          page_identifier: page.page_identifier || page.letter,
          page_number: page.page_number,
          page_type: page.page_type,
          title: page.title,
          description: page.description,
          content: page.content,
        }));

        const { error: insertPagesError } = await supabase
          .from('pages')
          .insert(pagesToInsert);

        if (insertPagesError) {
          // If pages insertion fails, try to clean up the book
          await supabase.from('books').delete().eq('id', newBook.id);
          throw new Error('Failed to duplicate book pages');
        }
      }

      return newBook;
    },
    onSuccess: (newBook) => {
      // Invalidate books queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book', newBook.id] });
      
      toast.success('Book duplicated successfully');
    },
    onError: (error: Error) => {
      console.error('Error duplicating book:', error);
      toast.error(error.message || 'Failed to duplicate book');
    },
  });
};
