/**
 * Book view tracking utilities
 * Tracks when books are viewed to enable "most recently viewed" sorting
 * Now uses database-backed storage for cross-device sync and persistence
 */

import { supabase } from '@/integrations/supabase/client';
import { queryClient } from '@/App';

/**
 * Track that a daily published book was viewed by the current user
 * Uses a two-step process: fetch current count, then upsert with increment
 * Invalidates library cache to update Recently Viewed in real-time
 * @param dailyPublishedId - The ID of the daily published book
 * @param kidId - Optional kid profile ID for personalized tracking
 */
export const trackBookView = async (dailyPublishedId: string, kidId?: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot track book view: User not authenticated');
      return;
    }

    // Step 1: Try to get existing record
    const { data: existing, error: selectError } = await supabase
      .from('user_book_activity')
      .select('view_count, id')
      .eq('user_id', user.id)
      .eq('daily_published_id', dailyPublishedId)
      .maybeSingle();

    // Handle SELECT errors (except "no rows" which is expected)
    if (selectError && selectError.code !== 'PGRST116') {
      console.warn('Select error:', selectError);
      return;
    }

    // Step 2: Update or insert based on result
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_book_activity')
        .update({
          last_viewed_at: new Date().toISOString(),
          view_count: existing.view_count + 1,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.warn('Update error:', updateError);
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('user_book_activity')
        .insert({
          user_id: user.id,
          kid_id: kidId || null,
          daily_published_id: dailyPublishedId,
          last_viewed_at: new Date().toISOString(),
          view_count: 1,
        });

      // Ignore duplicate key errors (23505 = race condition)
      if (insertError && insertError.code !== '23505') {
        console.warn('Insert error:', insertError);
      }
    }

    // Invalidate library books query to update Recently Viewed
    queryClient.invalidateQueries({ queryKey: ['library-books'] });
  } catch (error) {
    console.warn('Failed to track book view:', error);
  }
};

/**
 * Track that a user's own book was viewed/opened
 * For tracking activity on the Books page (user's created books)
 * @param bookId - The ID of the user's book
 * @param kidId - Optional kid profile ID for personalized tracking
 */
export const trackUserBookActivity = async (bookId: string, kidId?: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot track user book activity: User not authenticated');
      return;
    }

    // Step 1: Try to get existing record
    const { data: existing, error: selectError } = await supabase
      .from('user_book_activity')
      .select('view_count, id')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .maybeSingle();

    // Handle SELECT errors
    if (selectError && selectError.code !== 'PGRST116') {
      console.warn('Select error:', selectError);
      return;
    }

    // Step 2: Update or insert
    if (existing) {
      const { error: updateError } = await supabase
        .from('user_book_activity')
        .update({
          last_viewed_at: new Date().toISOString(),
          view_count: existing.view_count + 1,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.warn('Update error:', updateError);
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_book_activity')
        .insert({
          user_id: user.id,
          kid_id: kidId || null,
          book_id: bookId,
          last_viewed_at: new Date().toISOString(),
          view_count: 1,
        });

      if (insertError && insertError.code !== '23505') {
        console.warn('Insert error:', insertError);
      }
    }
  } catch (error) {
    console.warn('Failed to track user book activity:', error);
  }
};

/**
 * PHASE 2: LRU Cache Management - localStorage view tracking
 * Track when a book detail page is viewed for cache management
 */
export const trackBookViewForCache = (bookId: string): void => {
  try {
    const timestamp = Date.now();
    localStorage.setItem(`book-last-viewed-${bookId}`, timestamp.toString());
  } catch (error) {
    console.warn('Failed to track book view in localStorage:', error);
  }
};

/**
 * Get the last viewed timestamp for a book
 */
export const getLastViewed = (bookId: string): number | null => {
  try {
    const timestamp = localStorage.getItem(`book-last-viewed-${bookId}`);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.warn('Failed to get last viewed timestamp:', error);
    return null;
  }
};

/**
 * Get all books that haven't been viewed in X days
 */
export const getStaleBooks = (daysThreshold: number = 7): string[] => {
  try {
    const staleBooks: string[] = [];
    const cutoffTime = Date.now() - (daysThreshold * 24 * 60 * 60 * 1000);
    
    // Scan localStorage for book-last-viewed-* entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('book-last-viewed-')) {
        const bookId = key.replace('book-last-viewed-', '');
        const timestamp = parseInt(localStorage.getItem(key) || '0', 10);
        
        if (timestamp < cutoffTime) {
          staleBooks.push(bookId);
        }
      }
    }
    
    return staleBooks;
  } catch (error) {
    console.warn('Failed to get stale books:', error);
    return [];
  }
};

/**
 * Get all tracked books with their last viewed timestamps
 */
export const getAllTrackedBooks = (): Record<string, number> => {
  try {
    const trackedBooks: Record<string, number> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('book-last-viewed-')) {
        const bookId = key.replace('book-last-viewed-', '');
        const timestamp = parseInt(localStorage.getItem(key) || '0', 10);
        trackedBooks[bookId] = timestamp;
      }
    }
    
    return trackedBooks;
  } catch (error) {
    console.warn('Failed to get all tracked books:', error);
    return {};
  }
};

