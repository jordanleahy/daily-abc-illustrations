import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyPublishedWithBook {
  id: string;
  book_id: string;
  title: string;
  description: string | null;
  status: string;
  published_at: string;
  expires_at: string | null;
  is_active: boolean;
  queue_position: number | null;
  books: {
    book_name: string;
    category: string | null;
    total_pages: number | null;
    is_highlighted: boolean;
  } | null;
}

/**
 * Hook to fetch all daily published items (active, queued, expired)
 * for display on the landing page library section
 */
export const useAllDailyPublished = () => {
  return useQuery({
    queryKey: ['all-daily-published'],
    queryFn: async () => {
      console.log('🔍 Fetching all daily published items for library');

      const { data, error } = await supabase
        .from('daily_published')
        .select(`
          id,
          book_id,
          title,
          description,
          status,
          published_at,
          expires_at,
          is_active,
          queue_position,
          books:book_id (
            book_name,
            category,
            total_pages,
            is_highlighted
          )
        `)
        .in('status', ['active', 'queued', 'expired'])
        .order('published_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching daily published items:', error);
        throw error;
      }

      console.log('✅ Found daily published items:', data?.length || 0);
      return (data || []) as DailyPublishedWithBook[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
