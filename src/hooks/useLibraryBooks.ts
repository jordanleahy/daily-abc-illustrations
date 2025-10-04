import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

export const useLibraryBooks = () => {
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  
  return useQuery({
    queryKey: ['library-books'],
    queryFn: async () => {
      // Fetch daily_published with books
      const { data: dailyPublishedData, error: dpError } = await supabase
        .from('daily_published')
        .select(`
          *,
          book:books(
            book_name,
            book_description,
            user_id
          )
        `)
        .neq('status', 'draft')
        .order('queue_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (dpError) {
        console.error('Error fetching library books:', dpError);
        throw dpError;
      }

      // Fetch latest SEO metadata for all daily_published items
      const { data: seoData, error: seoError } = await supabase
        .from('seo_metadata')
        .select('daily_published_id, og_image_url')
        .eq('is_latest', true)
        .eq('is_active', true)
        .eq('optimization_status', 'complete');

      if (seoError) {
        console.error('Error fetching SEO metadata:', seoError);
      }

      // Map SEO data to daily_published items
      const seoMap = new Map(
        seoData?.map(seo => [seo.daily_published_id, seo.og_image_url]) || []
      );

      const enrichedData = dailyPublishedData?.map(item => ({
        ...item,
        og_image_url: seoMap.get(item.id) || null
      })) || [];

      return enrichedData as DailyPublishedWithBook[];

    },
    staleTime: 30 * 1000, // 30 seconds - more frequent updates for library
    gcTime: 60 * 1000, // 1 minute
  });
};