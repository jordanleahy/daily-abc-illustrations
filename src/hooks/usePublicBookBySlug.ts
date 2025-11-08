import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';

export const usePublicBookBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['public-book-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('daily_published')
        .select(`
          *,
          book:books(
            book_name,
            book_description,
            user_id,
            total_pages,
            created_at
          )
        `)
        .eq('slug', slug)
        .eq('is_publicly_visible', true)
        .in('status', ['active', 'queued', 'expired'])
        .maybeSingle();

      if (error) {
        console.error('Error fetching public book by slug:', error);
        throw error;
      }

      return data as DailyPublishedWithBook | null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
