import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';
import { queryKeys } from '@/hooks/queryKeys';
import type { LibraryBook } from '@/types/library';
import type { Json } from '@/integrations/supabase/types';

interface LibraryBookRow {
  id: string;
  book_name: string;
  book_description: string | null;
  category: string | null;
  is_library_book: boolean | null;
  created_at: string;
  updated_at: string;
  is_highlighted: boolean;
  metadata: Json | null;
  last_completed_at: string | null;
  completion_count: number;
  cover_image_url: string | null;
}

/**
 * Fetch all library books with cover images and user activity
 * Returns normalized LibraryBook[] for consistent component consumption
 */
export const useLibraryBooks = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  
  // Real-time subscription for user book activity, books, and daily_published
  useEffect(() => {
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
  }, [user?.id, queryClient]);
  
  return useQuery({
    queryKey: queryKeys.library.books,
    queryFn: async (): Promise<LibraryBook[]> => {
      if (!user) return [];

      // Use single RPC call instead of 3 separate queries
      const { data, error } = await supabase.rpc('get_library_books_by_completion', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching library books:', error);
        throw error;
      }

      // Transform to LibraryBook format
      return (data || []).map((book: LibraryBookRow) => ({
        id: book.id,
        book_name: book.book_name,
        book_description: book.book_description,
        created_at: book.created_at,
        updated_at: book.updated_at,
        is_highlighted: book.is_highlighted,
        total_pages: 0,
        cover_image: book.cover_image_url,
        last_viewed_at: book.last_completed_at,
        view_count: 0,
        completion_count: book.completion_count,
        metadata: book.metadata as LibraryBook['metadata'],
      }));
    },
    enabled: !!user,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
