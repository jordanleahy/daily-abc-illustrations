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
import { useAuth } from './useAuth';
import { Book } from '@/types/book';
import { toast } from 'sonner';
import { usePageImageSubscription } from './usePageImageSubscription';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Enable real-time subscriptions for page images
  usePageImageSubscription();

  const { data: books = [], isLoading, error } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get all books with their daily_published status
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          *,
          daily_published!left(status)
        `)
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('is_highlighted', { ascending: false })
        .order('created_at', { ascending: false });

      if (booksError) {
        console.error('Error fetching books:', booksError);
        toast.error('Failed to load books');
        throw booksError;
      }

      if (!booksData || booksData.length === 0) {
        return [];
      }

      // Combine books with their daily_published status
      const processedBooks = booksData.map(book => ({
        ...book,
        dailyPublishedStatus: book.daily_published?.[0]?.status || undefined
      }));
      
      // Sort by most recently updated (active) first
      return processedBooks.sort((a, b) => {
        // Highlighted books always come first
        if (a.is_highlighted !== b.is_highlighted) {
          return b.is_highlighted ? 1 : -1;
        }
        // Then sort by most recently updated
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
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