import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

export const useArchiveBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const { data, error } = await supabase.rpc('archive_book', {
        p_book_id: bookId
      });

      if (error) throw error;
      
      // Handle RPC response
      const result = data as { success: boolean; error?: string; book_id?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to archive book');
      }
      
      return bookId;
    },
    onMutate: async (bookId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['books'] });
      
      // Snapshot previous value
      const previousBooks = queryClient.getQueryData(['books']);
      
      // Optimistically remove the book from cache (archived books are excluded from list)
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
      
      console.error('Archive book error:', error);
      toast({
        variant: 'destructive',
        title: 'Archive Failed',
        description: error instanceof Error ? error.message : 'Failed to archive the book. Please try again.',
      });
    },
    onSuccess: (archivedBookId) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book'] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['book-publication-status'] });
      
      toast({
        title: 'Book Archived',
        description: 'The book has been archived and removed from the library.',
      });

      // Auto-redirect if currently viewing the archived book
      const currentPath = location.pathname;
      if (currentPath.includes(`/books/${archivedBookId}`)) {
        navigate('/books', { replace: true });
      }
    },
  });
};
