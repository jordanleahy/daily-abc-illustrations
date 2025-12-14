/**
 * useBookCompletion Hook
 * 
 * Simple hook to increment book completion count when user finishes reading.
 * Called ONCE when user reaches the last page of a book.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export const useBookCompletion = () => {
  const { user } = useAuthContext();

  /**
   * Increments the completion count for a book.
   * Call this ONCE when user finishes reading the book.
   */
  const incrementCompletion = useCallback(async (
    bookId: string,
    kidId?: string | null
  ): Promise<{ success: boolean; completion_count: number } | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('increment_book_completion', {
        p_user_id: user.id,
        p_book_id: bookId,
        p_kid_id: kidId || null
      });

      if (error) throw error;
      
      return data as { success: boolean; completion_count: number };
    } catch (error) {
      console.error('Failed to increment book completion:', error);
      return null;
    }
  }, [user]);

  return { incrementCompletion };
};
