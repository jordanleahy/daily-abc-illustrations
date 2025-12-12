import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';
import { queryKeys } from '@/hooks/queryKeys';
import type { LibraryBook } from '@/types/library';

/**
 * Fetch all library books with cover images and user activity
 * Returns normalized LibraryBook[] for consistent component consumption
 */
export const useLibraryBooks = () => {
  const queryClient = useQueryClient();
  
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  
  // Real-time subscription for user book activity, books, and daily_published
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const channel = supabase
        .channel('library-realtime-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_book_activity',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('User book activity changed:', payload);
            queryClient.invalidateQueries({ queryKey: queryKeys.library.books });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'books',
          },
          (payload) => {
            console.log('Book changed for library:', payload);
            queryClient.invalidateQueries({ queryKey: queryKeys.library.books });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_published',
          },
          (payload) => {
            console.log('Daily published changed for library:', payload);
            queryClient.invalidateQueries({ queryKey: queryKeys.library.books });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = getUser();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [queryClient]);
  
  return useQuery({
    queryKey: queryKeys.library.books,
    queryFn: async (): Promise<LibraryBook[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch books that are library books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          id,
          book_name,
          book_description,
          created_at,
          updated_at,
          is_highlighted,
          total_pages,
          metadata
        `)
        .eq('is_library_book', true)
        .order('created_at', { ascending: false });

      if (booksError) {
        console.error('Error fetching library books:', booksError);
        throw booksError;
      }

      if (!booksData || booksData.length === 0) {
        return [];
      }

      const bookIds = booksData.map(b => b.id);

      // Batch fetch cover images for all books
      const { data: coverImages } = await supabase
        .from('page_image_urls')
        .select(`
          image_url,
          book_id,
          pages!inner(page_type)
        `)
        .in('book_id', bookIds)
        .eq('pages.page_type', 'cover')
        .eq('is_latest', true)
        .not('image_url', 'is', null);

      // Create cover image lookup map
      const coverMap = new Map(
        (coverImages || []).map(img => [img.book_id, img.image_url])
      );

      // Batch fetch user activity (includes completion count per family)
      let activityMap = new Map();
      let completionMap = new Map<string, number>();
      if (user) {
        const { data: activityData } = await supabase
          .from('user_book_activity')
          .select('book_id, last_viewed_at, view_count, reading_completed')
          .eq('user_id', user.id)
          .in('book_id', bookIds);

        activityMap = new Map(
          (activityData || []).map(activity => [activity.book_id, activity])
        );
        
        // Count completions per book (per-family: all records for this user where reading_completed = true)
        (activityData || []).forEach(activity => {
          if (activity.reading_completed && activity.book_id) {
            completionMap.set(activity.book_id, (completionMap.get(activity.book_id) || 0) + 1);
          }
        });
      }

      // Transform to LibraryBook format
      const libraryBooks: LibraryBook[] = booksData.map(book => {
        const activity = activityMap.get(book.id);
        
        return {
          id: book.id,
          book_name: book.book_name,
          book_description: book.book_description,
          created_at: book.created_at,
          updated_at: book.updated_at,
          is_highlighted: book.is_highlighted || false,
          total_pages: book.total_pages || 0,
          cover_image: coverMap.get(book.id) || null,
          last_viewed_at: activity?.last_viewed_at || null,
          view_count: activity?.view_count || 0,
          completion_count: completionMap.get(book.id) || 0,
          metadata: book.metadata as LibraryBook['metadata'],
        };
      });

      return libraryBooks;
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
