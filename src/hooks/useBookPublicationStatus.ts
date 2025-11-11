import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DailyPublished } from '@/types/dailyPublished';

export const useBookPublicationStatus = (bookId?: string) => {
  return useQuery({
    queryKey: ['book-publication-status', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      const { data, error } = await supabase
        .from('daily_published')
        .select('*')
        .eq('book_id', bookId)
        .in('status', ['queued', 'active', 'expired'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DailyPublished | null;
    },
    enabled: !!bookId,
    // Uses global 7-day staleTime from App.tsx for instant loading
  });
};
