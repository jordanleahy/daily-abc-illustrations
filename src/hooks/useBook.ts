import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { Book } from '@/types/book';
import { toast } from 'sonner';

export const useBook = (bookId: string | undefined) => {
  const { user } = useAuthContext();
  const { isAdmin, isTeacher } = useRole();

  return useQuery({
    queryKey: ['book', bookId, isAdmin, isTeacher],
    queryFn: async () => {
      if (!bookId) return null;
      
      let query = supabase
        .from('books')
        .select('*')
        .eq('id', bookId);
      
      // Only filter by user_id if not admin or teacher
      if (!isAdmin && !isTeacher) {
        if (!user?.id) return null;
        query = query.eq('user_id', user.id);
      }
      
      const { data: bookData, error: bookError } = await query.maybeSingle();

      if (bookError) {
        console.error('Error fetching book:', bookError);
        toast.error('Failed to load book');
        throw bookError;
      }

      return bookData as Book | null;
    },
    enabled: !!bookId && (isAdmin || isTeacher || !!user?.id),
  });
};