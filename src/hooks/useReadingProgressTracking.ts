/**
 * Reading Progress Tracking Hook
 * 
 * Tracks user reading progress across all books in the application.
 * This hook manages the user_book_activity table which stores:
 * - Pages read count
 * - Reading completion status
 * - Last reading session timestamp
 * - View count
 * - Kid profile association (for parent accounts)
 * 
 * DATABASE DESIGN NOTES:
 * ----------------------
 * The user_book_activity table has a unique constraint on (user_id, book_id) WHERE book_id IS NOT NULL.
 * This means each user can only have ONE activity record per book, regardless of which kid profile is reading.
 * The kid_id field tracks the MOST RECENT kid who read the book.
 * 
 * IMPORTANT: The update_reading_progress database function uses:
 *   ON CONFLICT (user_id, book_id) WHERE book_id IS NOT NULL
 * This must match the actual constraint or the function will fail silently.
 * 
 * REAL-TIME UPDATES:
 * ------------------
 * The user_book_activity table has real-time enabled (REPLICA IDENTITY FULL).
 * Changes trigger automatic cache invalidation in useUserActivityAnalytics hooks.
 * 
 * @see supabase/migrations/*_update_reading_progress.sql for function implementation
 * @see src/hooks/useUserActivityAnalytics.ts for real-time subscription handling
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export const useReadingProgressTracking = () => {
  const { user } = useAuthContext();

  /**
   * Updates reading progress for a book
   * 
   * This function calls the update_reading_progress database function which:
   * 1. Creates or updates a user_book_activity record
   * 2. Tracks the maximum pages read (never decreases)
   * 3. Updates reading_completed flag when pagesRead >= totalPages
   * 4. Increments view_count on each call
   * 5. Updates last_reading_session_at timestamp
   * 6. Updates kid_id to track the most recent reader
   * 
   * The function uses UPSERT logic with ON CONFLICT handling:
   * - If no record exists: creates new record
   * - If record exists: updates with new values using GREATEST for pages_read
   * 
   * @param bookId - UUID of the book being read
   * @param pagesRead - Current page number the user has reached (1-indexed)
   * @param totalPages - Total number of pages in the book
   * @param kidId - Optional kid profile ID (for parent accounts tracking kid progress)
   * 
   * @example
   * // Called from UnifiedReadingView when navigating pages
   * updateProgress(book.id, currentPage, book.total_pages, selectedKid?.id);
   */
  const updateProgress = useCallback(async (
    bookId: string,
    pagesRead: number,
    totalPages: number,
    kidId?: string | null
  ) => {
    if (!user) return null;

    const readingCompleted = pagesRead >= totalPages;

    try {
      const { data, error } = await supabase.rpc('update_reading_progress', {
        p_user_id: user.id,
        p_book_id: bookId,
        p_kid_id: kidId || null,
        p_pages_read: pagesRead,
        p_reading_completed: readingCompleted
      });

      if (error) throw error;
      
      // Return the result containing completion_count and session info
      return data as { 
        success: boolean; 
        activity_id: string; 
        session_id: string; 
        completion_count: number; 
      } | null;
    } catch (error) {
      console.error('Failed to update reading progress:', error);
      return null;
    }
  }, [user]);

  return { updateProgress };
};
