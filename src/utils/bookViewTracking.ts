/**
 * Book view tracking utilities
 * Tracks when books are viewed to enable "most recently viewed" sorting
 * Now uses database-backed storage for cross-device sync and persistence
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Track that a daily published book was viewed by the current user
 * Uses a two-step process: fetch current count, then upsert with increment
 */
export const trackBookView = async (dailyPublishedId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot track book view: User not authenticated');
      return;
    }

    // First, try to get existing activity record
    const { data: existing } = await supabase
      .from('user_book_activity')
      .select('view_count')
      .eq('user_id', user.id)
      .eq('daily_published_id', dailyPublishedId)
      .maybeSingle();

    // Upsert with incremented view count
    const { error } = await supabase
      .from('user_book_activity')
      .upsert(
        {
          user_id: user.id,
          daily_published_id: dailyPublishedId,
          last_viewed_at: new Date().toISOString(),
          view_count: existing ? existing.view_count + 1 : 1,
        },
        {
          onConflict: 'user_id,daily_published_id',
        }
      );

    if (error) {
      console.warn('Failed to track book view:', error);
    }
  } catch (error) {
    console.warn('Failed to track book view:', error);
  }
};

/**
 * Track that a user's own book was viewed/opened
 * For tracking activity on the Books page (user's created books)
 */
export const trackUserBookActivity = async (bookId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot track user book activity: User not authenticated');
      return;
    }

    // First, try to get existing activity record
    const { data: existing } = await supabase
      .from('user_book_activity')
      .select('view_count')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .maybeSingle();

    // Upsert with incremented view count
    const { error } = await supabase
      .from('user_book_activity')
      .upsert(
        {
          user_id: user.id,
          book_id: bookId,
          last_viewed_at: new Date().toISOString(),
          view_count: existing ? existing.view_count + 1 : 1,
        },
        {
          onConflict: 'user_id,book_id',
        }
      );

    if (error) {
      console.warn('Failed to track user book activity:', error);
    }
  } catch (error) {
    console.warn('Failed to track user book activity:', error);
  }
};

/**
 * Legacy localStorage functions kept for backward compatibility
 * These are no longer used but kept to avoid breaking existing code
 */

const BOOK_VIEWS_KEY = 'book_view_timestamps';

interface BookViewRecord {
  [bookId: string]: number; // timestamp in milliseconds
}

export const getBookViewTimestamps = (): BookViewRecord => {
  try {
    const stored = localStorage.getItem(BOOK_VIEWS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to read book view timestamps:', error);
    return {};
  }
};

export const getBookViewTimestamp = (bookId: string): number | null => {
  const views = getBookViewTimestamps();
  return views[bookId] || null;
};

export const clearBookViewTracking = (): void => {
  try {
    localStorage.removeItem(BOOK_VIEWS_KEY);
  } catch (error) {
    console.warn('Failed to clear book view tracking:', error);
  }
};
