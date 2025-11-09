/**
 * @fileoverview Books data management hook
 * 
 * This hook provides comprehensive book data management including fetching user's books
 * and real-time updates. It uses React Query for caching and state management with 
 * Supabase real-time subscriptions.
 * 
 * Key Features:
 * - Fetches user's books with daily_published status
 * - Real-time updates via Supabase subscriptions
 * - Automatic cache invalidation and updates
 * - Error handling with user notifications
 * - Excludes archived books from results
 * 
 * @version 1.0.0
 * @author ABC Cards Team
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Book } from '@/types/book';
import { toast } from 'sonner';

/**
 * Books data management hook
 * 
 * Fetches and manages the current user's books with real-time updates.
 * Automatically excludes archived books and maintains real-time synchronization.
 * 
 * @hook
 * @returns {Object} Book data and loading state
 * @returns {Book[]} books - Array of user's books with daily_published status
 * @returns {boolean} loading - Whether books are being loaded
 * @returns {Error | null} error - Any error that occurred during loading
 * 
 * @example
 * ```tsx
 * const { books, loading, error } = useBooks();
 * 
 * if (loading) return <div>Loading books...</div>;
 * if (error) return <div>Error loading books</div>;
 * 
 * return (
 *   <div>
 *     {books.map(book => (
 *       <div key={book.id}>
 *         <h3>{book.book_name}</h3>
 *         <p>Status: {book.dailyPublishedStatus}</p>
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useBooks = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // ⚡ OPTIMIZED: Single query with JOIN instead of 2 separate queries
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          *,
          daily_published!left(status),
          activity:user_book_activity!left(
            last_viewed_at,
            view_count,
            user_id
          )
        `)
        .eq('user_id', user.id)
        .neq('status', 'archived');

      if (booksError) {
        console.error('Error fetching books:', booksError);
        toast.error('Failed to load books');
        throw booksError;
      }

      if (!booksData || booksData.length === 0) {
        return [];
      }

      // Map activity data directly from JOIN, filtering for current user
      const booksWithActivity = booksData.map(book => {
        const activityArr = Array.isArray(book.activity) ? book.activity : [book.activity].filter(Boolean);
        const userActivity = activityArr.find((a: any) => a?.user_id === user.id);
        
        return {
          ...book,
          dailyPublishedStatus: book.daily_published?.[0]?.status || undefined,
          last_viewed_at: userActivity?.last_viewed_at,
          view_count: userActivity?.view_count || 0,
        };
      });

      // Sort by: highlighted first, then by books.created_at (newest first)
      return booksWithActivity.sort((a, b) => {
        // First, sort by is_highlighted
        if (a.is_highlighted !== b.is_highlighted) {
          return b.is_highlighted ? 1 : -1;
        }

        // Then sort by created_at (most recent first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
    enabled: !!user?.id,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('books-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Book inserted:', payload.new);
          // Refetch to get the full data with daily_published status
          queryClient.invalidateQueries({ queryKey: ['books', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Book updated:', payload.new);
          // Refetch to get the updated data with daily_published status
          queryClient.invalidateQueries({ queryKey: ['books', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Book deleted:', payload.old);
          queryClient.setQueryData(['books', user.id], (old: Book[] = []) =>
            old.filter(book => book.id !== payload.old.id)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_published'
        },
        (payload) => {
          console.log('Daily published changed:', payload);
          // Refetch books when daily_published status changes
          queryClient.invalidateQueries({ queryKey: ['books', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    books,
    loading: isLoading,
    error
  };
};