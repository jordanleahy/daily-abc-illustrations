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
import { useRole } from '@/contexts/RoleContext';
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
export const useBooks = (
  viewMode: 'my-books' | 'all-books' = 'my-books',
  pagination?: { page: number; pageSize: number }
) => {
  const { user } = useAuthContext();
  const { isAdmin, isTeacher } = useRole();
  const queryClient = useQueryClient();

  const { data: booksResult, isLoading, error } = useQuery({
    queryKey: ['books', user?.id, isAdmin, isTeacher, viewMode, pagination?.page, pagination?.pageSize],
    queryFn: async () => {
      if (!user?.id) return { books: [], totalCount: 0 };
      
      // ⚡ OPTIMIZED: Single query with JOIN including cover images
      let query = supabase
        .from('books')
        .select(`
          *,
          daily_published!left(id, status, publish_date, is_active),
          activity:user_book_activity!left(
            last_viewed_at,
            view_count,
            user_id
          ),
          pages!left(
            id,
            page_type,
            page_image_urls!left(
              image_url,
              is_latest
            )
          )
        `, { count: 'exact' });
      
      // Determine if we should show all books
      const showAllBooks = viewMode === 'all-books' && (isAdmin || isTeacher);
      
      query = showAllBooks
        ? query.neq('status', 'archived')  // All books for admins on /all-books
        : query.eq('user_id', user.id).neq('status', 'archived');  // User's books
      
      // Apply pagination if provided (for performance on all-books view)
      if (pagination) {
        const from = (pagination.page - 1) * pagination.pageSize;
        const to = from + pagination.pageSize - 1;
        query = query.range(from, to);
      }
      
      const { data: booksData, error: booksError, count } = await query;

      if (booksError) {
        console.error('Error fetching books:', booksError);
        toast.error('Failed to load books');
        throw booksError;
      }

      if (!booksData || booksData.length === 0) {
        return {
          books: [],
          totalCount: 0
        };
      }

      // Map activity and cover image data directly from JOIN
      const booksWithActivity = booksData.map(book => {
        const activityArr = Array.isArray(book.activity) ? book.activity : [book.activity].filter(Boolean);
        const userActivity = activityArr.find((a: any) => a?.user_id === user.id);
        
        // Extract cover image from pages with page_type = 'cover' and is_latest = true
        const pagesArr = Array.isArray(book.pages) ? book.pages : [book.pages].filter(Boolean);
        const coverPage = pagesArr.find((p: any) => p?.page_type === 'cover');
        const coverImageUrls = coverPage?.page_image_urls || [];
        const coverImageArr = Array.isArray(coverImageUrls) ? coverImageUrls : [coverImageUrls].filter(Boolean);
        const latestCoverImage = coverImageArr.find((img: any) => img?.is_latest === true);
        const coverImageUrl = latestCoverImage?.image_url || null;
        
        // Remove pages array from response (only used for extraction)
        const { pages, activity, ...bookData } = book;
        
        return {
          ...bookData,
          dailyPublishedStatus: book.daily_published?.[0]?.status || undefined,
          last_viewed_at: userActivity?.last_viewed_at,
          view_count: userActivity?.view_count || 0,
          coverImageUrl,
        };
      });

      const sortedBooks = booksWithActivity.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      return {
        books: sortedBooks,
        totalCount: count || sortedBooks.length
      };
    },
    enabled: !!user?.id,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const showAllBooks = viewMode === 'all-books' && (isAdmin || isTeacher);

    const insertConfig: any = {
      event: 'INSERT',
      schema: 'public',
      table: 'books',
    };
    
    // Only filter by user_id if not showing all books
    if (!showAllBooks) {
      insertConfig.filter = `user_id=eq.${user.id}`;
    }

    const channel = supabase
      .channel('books-changes')
      .on(
        'postgres_changes',
        insertConfig,
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
          ...(!showAllBooks && { filter: `user_id=eq.${user.id}` })
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
          ...(!showAllBooks && { filter: `user_id=eq.${user.id}` })
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
  }, [user?.id, isAdmin, isTeacher, viewMode, queryClient, pagination]);

  return {
    books: booksResult?.books || [],
    totalCount: booksResult?.totalCount || 0,
    loading: isLoading,
    error
  };
};