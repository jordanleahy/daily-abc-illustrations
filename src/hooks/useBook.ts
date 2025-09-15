import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Book } from '@/types/book';
import { toast } from 'sonner';

export const useBook = (bookId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      if (!bookId || !user?.id) return null;
      
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (bookError) {
        console.error('Error fetching book:', bookError);
        toast.error('Failed to load book');
        throw bookError;
      }

      return bookData as Book | null;
    },
    enabled: !!(bookId && user?.id),
  });
};