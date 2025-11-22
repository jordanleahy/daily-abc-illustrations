import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export const useReadingProgressTracking = () => {
  const { user } = useAuthContext();

  const updateProgress = useCallback(async (
    bookId: string,
    pagesRead: number,
    totalPages: number,
    kidId?: string | null
  ) => {
    if (!user) return;

    const readingCompleted = pagesRead >= totalPages;

    try {
      const { error } = await supabase.rpc('update_reading_progress', {
        p_user_id: user.id,
        p_book_id: bookId,
        p_kid_id: kidId || null,
        p_pages_read: pagesRead,
        p_reading_completed: readingCompleted
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update reading progress:', error);
    }
  }, [user]);

  return { updateProgress };
};
