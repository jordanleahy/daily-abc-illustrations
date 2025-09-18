import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';

export const usePublicBook = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['public-book', bookId],
    queryFn: async () => {
      if (!bookId) return null;
      
      // First check if this book is part of an active daily published content
      const { data: dailyPublished, error: dailyError } = await supabase
        .from('daily_published')
        .select('book_id')
        .eq('book_id', bookId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (dailyError || !dailyPublished) {
        return null; // Only allow access to books that are daily published
      }

      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .maybeSingle();

      if (bookError) {
        console.error('Error fetching public book:', bookError);
        throw bookError;
      }

      return bookData as Book | null;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};