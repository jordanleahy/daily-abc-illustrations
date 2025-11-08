/**
 * Book view tracking utilities
 * Tracks when books are viewed to enable "most recently viewed" sorting
 * Now uses database-backed storage for cross-device sync and persistence
 */

import { supabase } from '@/integrations/supabase/client';
import { queryClient } from '@/App';

/**
 * SIMPLIFIED: Track book view with kid-specific scoping
 * Uses deterministic two-step write (select, then update OR insert)
 * Correctly invalidates kid-specific cache for immediate home page updates
 */
export const trackKidBookView = async (dailyPublishedId: string, kidId?: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Cannot track book view: User not authenticated');
      return;
    }

    // Step 1: Scoped query - check for existing activity with this exact kid_id (or null for parent)
    let query = supabase
      .from('user_book_activity')
      .select('id, view_count')
      .eq('user_id', user.id)
      .eq('daily_published_id', dailyPublishedId);
    
    // Apply kid_id filter based on whether kidId is provided
    if (kidId) {
      query = query.eq('kid_id', kidId);
    } else {
      query = query.is('kid_id', null);
    }
    
    const { data: existing } = await query.maybeSingle();

    const now = new Date().toISOString();

    if (existing) {
      // Step 2a: Update existing record with scoped match
      const { error } = await supabase
        .from('user_book_activity')
        .update({
          last_viewed_at: now,
          view_count: existing.view_count + 1,
        })
        .match({
          user_id: user.id,
          daily_published_id: dailyPublishedId,
          kid_id: kidId || null,
        });

      if (error) {
        console.warn('Failed to update book view:', error);
        return;
      }
    } else {
      // Step 2b: Insert new record
      const { error } = await supabase
        .from('user_book_activity')
        .insert({
          user_id: user.id,
          daily_published_id: dailyPublishedId,
          kid_id: kidId || null,
          last_viewed_at: now,
          view_count: 1,
        });

      if (error) {
        console.warn('Failed to insert book view:', error);
        return;
      }
    }

    // CRITICAL: Invalidate the CORRECT cache key that the home page uses
    queryClient.invalidateQueries({ queryKey: ['kid-recently-read', kidId] });
  } catch (error) {
    console.warn('Failed to track book view:', error);
  }
};

/**
 * @deprecated Use trackKidBookView instead for proper kid-scoped tracking
 */
export const trackBookView = trackKidBookView;

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

