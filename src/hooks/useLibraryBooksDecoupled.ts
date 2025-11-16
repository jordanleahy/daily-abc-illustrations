import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LibraryBook } from '@/types/library';

export const useLibraryBooksDecoupled = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['library-books-decoupled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select(`
          id,
          book_name,
          book_description,
          created_at,
          updated_at,
          is_highlighted
        `)
        .eq('is_library_book', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get current user for activity data
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get page counts, cover images, and user activity for each book
      const booksWithData = await Promise.all(
        (data || []).map(async (book) => {
          // Get page count
          const { count } = await supabase
            .from('pages')
            .select('*', { count: 'exact', head: true })
            .eq('book_id', book.id);
          
          // Get cover image from page_type = 'cover'
          const { data: coverPageData } = await supabase
            .from('pages')
            .select(`
              id,
              page_image_urls!inner(
                image_url,
                is_latest
              )
            `)
            .eq('book_id', book.id)
            .eq('page_type', 'cover')
            .eq('page_image_urls.is_latest', true)
            .maybeSingle();
          
          const coverImage = coverPageData?.page_image_urls?.[0]?.image_url || null;

          // Get user activity data if user is logged in
          let userActivity = null;
          if (user) {
            const { data: activityData } = await supabase
              .from('user_book_activity')
              .select('last_viewed_at, view_count')
              .eq('book_id', book.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            userActivity = activityData;
          }
          
          return {
            ...book,
            total_pages: count || 0,
            cover_image: coverImage,
            last_viewed_at: userActivity?.last_viewed_at || null,
            view_count: userActivity?.view_count || 0
          } as LibraryBook;
        })
      );

      return booksWithData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Real-time subscription for library books updates
  useEffect(() => {
    const channel = supabase
      .channel('library-books-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
          filter: 'is_library_book=eq.true'
        },
        (payload) => {
          console.log('Library book changed:', payload);
          // Invalidate and refetch when any library book changes
          queryClient.invalidateQueries({ queryKey: ['library-books-decoupled'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};
