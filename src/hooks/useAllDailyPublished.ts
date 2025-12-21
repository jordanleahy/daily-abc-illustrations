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
  og_image_url: string | null;
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

      // Fetch daily published items
      const { data: dailyData, error: dailyError } = await supabase
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

      if (dailyError) {
        console.error('❌ Error fetching daily published items:', dailyError);
        throw dailyError;
      }

      // Fetch all latest SEO metadata
      const { data: seoData, error: seoError } = await supabase
        .from('seo_metadata')
        .select('daily_published_id, og_image_url')
        .eq('is_latest', true)
        .eq('is_active', true);

      if (seoError) {
        console.error('❌ Error fetching SEO metadata:', seoError);
      }

      // Create a map of daily_published_id to og_image_url
      const seoMap = new Map(
        (seoData || []).map(item => [item.daily_published_id, item.og_image_url])
      );

      // Combine the data
      const combined = (dailyData || []).map(item => ({
        ...item,
        og_image_url: seoMap.get(item.id) || null
      }));

      console.log('✅ Found daily published items:', combined.length);
      return combined as DailyPublishedWithBook[];
    },
    // Uses global 7-day staleTime from App.tsx for instant loading
  });
};
