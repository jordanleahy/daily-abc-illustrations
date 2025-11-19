import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { Book } from '@/types/book';
import { toast } from 'sonner';

export const useBook = (bookId: string | undefined) => {
  const { user } = useAuthContext();
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useRole();
  const queryClient = useQueryClient();

  // Real-time subscription for book changes
  useEffect(() => {
    if (!bookId) return;

    console.log('[Real-time] Setting up book subscription for:', bookId);

    const channel = supabase
      .channel(`book-${bookId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'books',
          filter: `id=eq.${bookId}`
        },
        (payload) => {
          console.log('[Real-time] Book changed:', payload);
          
          // Invalidate the book query to trigger refetch
          queryClient.invalidateQueries({
            queryKey: ['book', bookId]
          });
        }
      )
      .subscribe();

    return () => {
      console.log('[Real-time] Cleaning up book subscription for:', bookId);
      supabase.removeChannel(channel);
    };
  }, [bookId, queryClient]);

  return useQuery({
    queryKey: ['book', bookId, isAdmin, isTeacher],
    queryFn: async () => {
      if (!bookId) return null;
      
      console.log('[useBook] Fetching book:', bookId);
      
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
    // Enable query immediately if bookId exists and user is authenticated
    // Don't wait for roles to load since admins/teachers can access any book
    enabled: !!bookId && !!user?.id && !rolesLoading,
  });
};