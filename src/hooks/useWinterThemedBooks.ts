import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DailyPublishedWithBook } from '@/types/dailyPublished';

export const useWinterThemedBooks = () => {
  return useQuery({
    queryKey: ['winter-themed-books'],
    queryFn: async (): Promise<DailyPublishedWithBook[]> => {
      const { data, error } = await supabase
        .from('daily_published')
        .select(`
          *,
          book:books!inner(
            id,
            book_name,
            book_description,
            category,
            total_pages,
            status,
            user_id
          ),
          seo_metadata:seo_metadata(
            og_image_url
          )
        `)
        .or('title.ilike.%snow%,title.ilike.%winter%,title.ilike.%ski%,title.ilike.%mountain%,title.ilike.%snowboard%,title.ilike.%chairlift%')
        .eq('status', 'active')
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      return (data || []) as unknown as DailyPublishedWithBook[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
